import "server-only";

import { getSupabaseUrl, hasSupabaseAdminConfig } from "@/lib/supabase/config";

export async function createSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasSupabaseAdminConfig() || !url || !key) {
    throw new Error("Supabase no está configurado para operaciones administrativas.");
  }

  const { createClient } = await import("@supabase/supabase-js");

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
