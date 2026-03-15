import "server-only";

import { NextResponse } from "next/server";

import { hasSupabaseBrowserConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedRoles = new Set(["editor", "admin"]);

export interface EditorAccessState {
  authEnabled: boolean;
  bypass: boolean;
  email?: string;
  role?: string;
  allowed: boolean;
  loginHref?: string;
  denialReason?: "auth" | "role";
}

export async function requireEditorPageAccess(nextPath: string): Promise<EditorAccessState> {
  const access = await getEditorAccessState();
  const loginHref = buildLoginHref(nextPath);
  const roleHref = buildLoginHref(nextPath, "role");

  if (!access.authEnabled) {
    return {
      ...access,
      allowed: true
    };
  }

  if (!access.email) {
    return {
      ...access,
      allowed: false,
      denialReason: "auth",
      loginHref
    };
  }

  if (!access.role || !allowedRoles.has(access.role)) {
    return {
      ...access,
      allowed: false,
      denialReason: "role",
      loginHref: roleHref
    };
  }

  return {
    ...access,
    allowed: true,
    loginHref
  };
}

export async function requireEditorApiAccess() {
  const access = await getEditorAccessState();

  if (!access.authEnabled) {
    return { allowed: true, access };
  }

  if (!access.email) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Debes iniciar sesión como editor para usar esta ruta." },
        { status: 401 }
      )
    };
  }

  if (!access.role || !allowedRoles.has(access.role)) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Tu sesión no tiene permisos editor/admin." },
        { status: 403 }
      )
    };
  }

  return { allowed: true, access };
}

async function getEditorAccessState(): Promise<EditorAccessState> {
  if (!hasSupabaseBrowserConfig()) {
    return {
      authEnabled: false,
      bypass: true,
      role: "local-dev",
      allowed: true
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: sessionData }, { data: userData }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser()
  ]);

  const email = userData.user?.email;
  const role =
    getRoleFromAccessToken(sessionData.session?.access_token) ??
    readUserRole(userData.user?.app_metadata) ??
    readUserRole(userData.user?.user_metadata);

  return {
    authEnabled: true,
    bypass: false,
    email,
    role,
    allowed: false
  };
}

function buildLoginHref(nextPath: string, error?: "role") {
  const params = new URLSearchParams({ next: nextPath });

  if (error) {
    params.set("error", error);
  }

  return `/admin/login?${params.toString()}`;
}

function readUserRole(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const value = (metadata as Record<string, unknown>).app_role;
  return typeof value === "string" ? value : undefined;
}

function getRoleFromAccessToken(token?: string) {
  if (!token) {
    return undefined;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return undefined;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    ) as Record<string, unknown>;

    return typeof payload.app_role === "string" ? payload.app_role : undefined;
  } catch {
    return undefined;
  }
}
