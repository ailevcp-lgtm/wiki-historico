"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { SourceImportStatus } from "@/types/staging";

const statuses: SourceImportStatus[] = ["pending", "parsed", "needs_review", "imported", "failed"];

export function SourceDocumentStatusForm({
  currentStatus,
  documentId
}: {
  currentStatus: SourceImportStatus;
  documentId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SourceImportStatus>(currentStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/import/stage/${documentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ importStatus: status })
      });

      if (!response.ok) {
        const payload = await response.json();
        setMessage(payload.error ?? "No se pudo actualizar el estado.");
        return;
      }

      setMessage("Estado actualizado.");
      router.refresh();
    } catch {
      setMessage("Falló la actualización del estado.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-sm border border-wiki-border bg-wiki-page p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">Estado editorial</div>
      <div className="mt-3 flex flex-col gap-3 md:flex-row">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as SourceImportStatus)}
          className="rounded-sm border border-wiki-border bg-white px-3 py-2 text-sm"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Actualizar estado"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-wiki-muted">{message}</p> : null}
    </div>
  );
}
