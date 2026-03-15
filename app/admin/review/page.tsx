import Link from "next/link";

import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { requireEditorPageAccess } from "@/lib/editor/auth";
import { listSourceDocuments } from "@/lib/staging/store";

export default async function AdminReviewPage() {
  const access = await requireEditorPageAccess("/admin/review");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }
  const documents = await listSourceDocuments();

  return (
    <section className="space-y-6">
      <EditorAccessNotice access={access} />

      <header className="wiki-paper p-5 md:p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Revisión editorial</p>
        <h1 className="wiki-page-title mt-2">Cola de importación</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
          Aquí quedan las fichas `.docx` ya normalizadas antes de publicarlas o transformarlas en
          artículos y perfiles definitivos.
        </p>
      </header>

      <section className="wiki-paper p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl">Documentos staged</h2>
          <Link href="/admin/import" className="wiki-link text-sm">
            Cargar más fichas
          </Link>
        </div>

        <div className="mt-5 space-y-4">
          {documents.length === 0 ? (
            <p className="text-wiki-muted">Todavía no hay documentos guardados en la cola editorial.</p>
          ) : (
            documents.map((document) => (
              <article key={document.id} className="rounded-sm border border-wiki-border bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="wiki-badge">{document.detectedKind}</span>
                  <span className="wiki-badge">{document.importStatus}</span>
                  <span className="wiki-badge">{document.stagingMode}</span>
                </div>
                <h2 className="mt-3 font-heading text-2xl">
                  <Link href={`/admin/review/${document.id}`} className="hover:text-wiki-blue">
                    {document.sourceName}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-wiki-muted">
                  Target slug: {document.targetSlug ?? "sin slug"} · {new Date(document.createdAt).toLocaleString("es-AR")}
                </p>
                {document.importStatus === "imported" && document.targetSlug ? (
                  <p className="mt-2 text-sm text-wiki-muted">
                    Destino{" "}
                    <Link
                      href={
                        document.detectedKind === "country"
                          ? `/admin/countries/${document.targetSlug}`
                          : `/admin/articles?slug=${document.targetSlug}`
                      }
                      className="wiki-link"
                    >
                      {document.detectedKind === "country"
                        ? `/admin/countries/${document.targetSlug}`
                        : `/admin/articles?slug=${document.targetSlug}`}
                    </Link>
                  </p>
                ) : null}
                {document.parseNotes ? (
                  <p className="mt-3 text-sm text-wiki-muted whitespace-pre-wrap">{document.parseNotes}</p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
