import { EditorLoginForm } from "@/components/editor-login-form";
import { hasSupabaseBrowserConfig } from "@/lib/supabase/config";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <div className="space-y-6">
      {!hasSupabaseBrowserConfig() ? (
        <section className="wiki-paper p-5 md:p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Configuración</p>
          <h1 className="wiki-page-title mt-2">Supabase Auth no está activo</h1>
          <p className="mt-3 max-w-3xl text-wiki-muted">
            Para exigir login admin debes definir <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Mientras tanto, el panel queda en bypass
            local para desarrollo.
          </p>
        </section>
      ) : null}

      <EditorLoginForm
        error={resolvedSearchParams?.error}
        nextPath={resolvedSearchParams?.next}
      />
    </div>
  );
}
