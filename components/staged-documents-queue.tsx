"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { BatchPromotionResult } from "@/types/staging";

type QueueDocumentSummary = {
  id: string;
  sourceName: string;
  detectedKind: string;
  importStatus: string;
  stagingMode: string;
  targetSlug?: string;
  parseNotes?: string;
  createdAt: string;
};

export function StagedDocumentsQueue({
  documents
}: {
  documents: QueueDocumentSummary[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPromoting, setIsPromoting] = useState(false);
  const [message, setMessage] = useState("");
  const [failures, setFailures] = useState<BatchPromotionResult["failed"]>([]);

  const promotableIds = documents.filter(isPromotableDocument).map((document) => document.id);
  const selectedCount = selectedIds.length;

  function toggleDocument(documentId: string) {
    setSelectedIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId]
    );
  }

  function selectPromotable() {
    setSelectedIds(promotableIds);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function handlePromoteSelected() {
    if (selectedIds.length === 0) {
      return;
    }

    setIsPromoting(true);
    setMessage("");
    setFailures([]);

    try {
      const response = await fetch("/api/import/stage/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      const payload = (await response.json()) as BatchPromotionResult & { error?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "No se pudieron promover las fichas seleccionadas.");
        return;
      }

      const promotedIds = payload.promoted.map((entry) => entry.documentId);
      setSelectedIds((current) => current.filter((id) => !promotedIds.includes(id)));
      setFailures(payload.failed);

      if (payload.promoted.length > 0 && payload.failed.length > 0) {
        setMessage(
          `Se promovieron ${payload.promoted.length} documento(s). ${payload.failed.length} quedaron con error para revisar.`
        );
      } else if (payload.promoted.length > 0) {
        setMessage(`Se promovieron ${payload.promoted.length} documento(s) a la wiki.`);
      } else {
        setMessage("No se pudo promover ninguna de las fichas seleccionadas.");
      }

      router.refresh();
    } catch {
      setMessage("Falló la promoción múltiple de documentos.");
    } finally {
      setIsPromoting(false);
    }
  }

  return (
    <div className="mt-5 space-y-4">
      {documents.length === 0 ? (
        <p className="text-wiki-muted">Todavía no hay documentos guardados en la cola editorial.</p>
      ) : (
        <>
          <div className="rounded-sm border border-wiki-border bg-wiki-page p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  Seleccionados: {selectedCount} de {promotableIds.length} elegibles
                </p>
                <p className="mt-1 text-sm text-wiki-muted">
                  Puedes promover varias fichas juntas aunque estén en `parsed` o `needs_review`.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectPromotable}
                  disabled={isPromoting || promotableIds.length === 0}
                  className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  Seleccionar elegibles
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={isPromoting || selectedCount === 0}
                  className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  Limpiar selección
                </button>
                <button
                  type="button"
                  onClick={handlePromoteSelected}
                  disabled={isPromoting || selectedCount === 0}
                  className="rounded-sm border border-wiki-blue bg-wiki-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isPromoting ? "Promoviendo..." : "Promover seleccionados a la wiki"}
                </button>
              </div>
            </div>

            {message ? <p className="mt-3 text-sm text-wiki-muted">{message}</p> : null}
            {failures.length > 0 ? (
              <div className="mt-3 rounded-sm border border-wiki-border bg-white p-3">
                <p className="text-sm font-semibold">Documentos con error</p>
                <ul className="mt-2 space-y-1 text-sm text-wiki-muted">
                  {failures.slice(0, 8).map((failure) => (
                    <li key={failure.documentId}>
                      {(failure.sourceName ?? failure.documentId) + ": " + failure.detail}
                    </li>
                  ))}
                  {failures.length > 8 ? (
                    <li>Hay {failures.length - 8} error(es) más en este lote.</li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>

          {documents.map((document) => {
            const isPromotable = isPromotableDocument(document);
            const isSelected = selectedIds.includes(document.id);
            const isImported = document.importStatus === "imported";

            return (
              <article
                key={document.id}
                className={`rounded-sm border p-4 ${
                  isSelected
                    ? "border-wiki-blue bg-wiki-page"
                    : isImported
                      ? "wiki-surface-success"
                    : "border-wiki-border bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isImported ? (
                    <span
                      className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#2f6f4f] bg-[#eef8f1] text-[10px] font-bold leading-none text-[#1f5136]"
                      aria-label="Documento ya importado"
                      title="Documento ya importado"
                    >
                      ✓
                    </span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDocument(document.id)}
                      disabled={!isPromotable || isPromoting}
                      className="mt-1 h-4 w-4 rounded border-wiki-border"
                      aria-label={`Seleccionar ${document.sourceName}`}
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="wiki-badge">{document.detectedKind}</span>
                      <span className={isImported ? "wiki-badge-success" : "wiki-badge"}>
                        {document.importStatus}
                      </span>
                      <span className="wiki-badge">{document.stagingMode}</span>
                    </div>
                    <h2 className="mt-3 font-heading text-2xl">
                      <Link href={`/admin/review/${document.id}`} className="hover:text-wiki-blue">
                        {document.sourceName}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm text-wiki-muted">
                      Target slug: {document.targetSlug ?? "sin slug"} ·{" "}
                      {new Date(document.createdAt).toLocaleString("es-AR")}
                    </p>

                    {!isPromotable ? (
                      <p
                        className={`mt-2 text-sm ${
                          isImported ? "text-[#1f5136]" : "text-wiki-muted"
                        }`}
                      >
                        {document.importStatus === "imported"
                          ? "Ya fue promovido a la wiki."
                          : document.detectedKind === "unknown"
                            ? "No es elegible para promoción directa porque el tipo no fue reconocido."
                            : "No es elegible para promoción directa."}
                      </p>
                    ) : null}

                    {isImported && document.targetSlug ? (
                      <p className="mt-2 text-sm text-[#1f5136]">
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
                      <p className="mt-3 whitespace-pre-wrap text-sm text-wiki-muted">
                        {document.parseNotes}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </>
      )}
    </div>
  );
}

function isPromotableDocument(document: QueueDocumentSummary) {
  return document.detectedKind !== "unknown" && document.importStatus !== "imported";
}
