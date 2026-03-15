import { EditorLogoutButton } from "@/components/editor-logout-button";
import type { EditorAccessState } from "@/lib/editor/auth";

export function EditorAccessNotice({ access }: { access: EditorAccessState }) {
  return (
    <section className="wiki-paper p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">Sesión editorial</div>
          {access.bypass ? (
            <p className="mt-2 text-sm text-wiki-muted">
              Auth editorial desactivada porque faltan variables públicas de Supabase. El acceso
              está en bypass local.
            </p>
          ) : (
            <p className="mt-2 text-sm text-wiki-muted">
              {access.email} · rol <strong>{access.role}</strong>
            </p>
          )}
        </div>

        {!access.bypass ? <EditorLogoutButton /> : null}
      </div>
    </section>
  );
}
