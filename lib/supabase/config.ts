export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function hasSupabaseBrowserConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
