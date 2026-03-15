"use client";

import { useState } from "react";

import { hasSupabaseBrowserConfig } from "@/lib/supabase/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function EditorLogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!hasSupabaseBrowserConfig()) {
    return null;
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.assign("/admin/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="rounded-sm border border-wiki-border bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
    >
      {isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
