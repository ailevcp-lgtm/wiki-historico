import "server-only";

import { cookies } from "next/headers";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error("Falta la configuración pública de Supabase para auth SSR.");
  }

  const cookieStore = await cookies();
  const { createServerClient } = await import("@supabase/ssr");

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, options, value } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // En algunos contextos de RSC los cookies son de solo lectura.
        }
      }
    }
  });
}
