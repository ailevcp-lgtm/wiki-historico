import Link from "next/link";

import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { StagedDocumentsQueue } from "@/components/staged-documents-queue";
import { requireEditorPageAccess } from "@/lib/editor/auth";
import { listSourceDocuments } from "@/lib/staging/store";

export default async function AdminReviewPage() {
  const access = await requireEditorPageAccess("/admin/review");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }
  const documents = await listSourceDocuments();
  const queueDocuments = documents.map((document) => ({
    id: document.id,
    sourceName: document.sourceName,
    detectedKind: document.detectedKind,
    importStatus: document.importStatus,
    stagingMode: document.stagingMode,
    targetSlug: document.targetSlug,
    parseNotes: document.parseNotes,
    createdAt: document.createdAt
  }));

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
        <StagedDocumentsQueue documents={queueDocuments} />
      </section>
    </section>
  );
}
