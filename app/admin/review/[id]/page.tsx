import Link from "next/link";
import { notFound } from "next/navigation";

import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { PromoteSourceDocumentButton } from "@/components/promote-source-document-button";
import { SourceDocumentStatusForm } from "@/components/source-document-status-form";
import { requireEditorPageAccess } from "@/lib/editor/auth";
import { getSourceDocumentById } from "@/lib/staging/store";

export default async function AdminReviewDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await requireEditorPageAccess("/admin/review");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }
  const { id } = await params;
  const document = await getSourceDocumentById(id);

  if (!document) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <EditorAccessNotice access={access} />

      <section className="wiki-paper p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          <span className="wiki-badge">{document.detectedKind}</span>
          <span className="wiki-badge">{document.importStatus}</span>
          <span className="wiki-badge">{document.stagingMode}</span>
        </div>
        <h1 className="wiki-page-title mt-4">{document.sourceName}</h1>
        <p className="mt-3 text-wiki-muted">
          Target slug: {document.targetSlug ?? "sin slug"} · actualizado{" "}
          {new Date(document.updatedAt).toLocaleString("es-AR")}
        </p>
      </section>

      <SourceDocumentStatusForm documentId={document.id} currentStatus={document.importStatus} />
      <PromoteSourceDocumentButton
        documentId={document.id}
        disabled={document.detectedKind === "unknown" || document.importStatus === "imported"}
      />

      {document.importStatus === "imported" && document.targetSlug ? (
        <section className="wiki-paper p-5 md:p-6">
          <h2 className="font-heading text-2xl">Destino editorial</h2>
          <p className="mt-3 text-wiki-muted">
            Esta ficha ya fue promovida. Puedes abrir el resultado en{" "}
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
            .
          </p>
        </section>
      ) : null}

      <section className="wiki-paper p-5 md:p-6">
        <h2 className="font-heading text-2xl">Payload normalizado</h2>
        <pre className="mt-4 overflow-x-auto rounded-sm border border-wiki-border bg-wiki-page p-4 text-sm whitespace-pre-wrap">
          {JSON.stringify(document.normalizedPayload, null, 2)}
        </pre>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <h2 className="font-heading text-2xl">Texto fuente normalizado</h2>
        <pre className="mt-4 overflow-x-auto rounded-sm border border-wiki-border bg-wiki-page p-4 text-sm whitespace-pre-wrap">
          {document.rawText}
        </pre>
      </section>
    </div>
  );
}
