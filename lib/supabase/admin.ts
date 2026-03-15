import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "@/lib/supabase/config";

export function hasSupabaseAdminConfig() {
  return Boolean(getSupabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase no está configurado para operaciones administrativas.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
