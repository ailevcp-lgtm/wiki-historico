"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ArticleStatus } from "@/types/wiki";

const statuses: ArticleStatus[] = ["draft", "review", "published"];

export function ArticleStatusForm({
  currentStatus,
  slug
}: {
  currentStatus: ArticleStatus;
  slug: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ArticleStatus>(currentStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/editor/articles/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      const payload = await response.json();

      if (!response.ok) {
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
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as ArticleStatus)}
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
        {isSaving ? "Guardando..." : "Guardar estado"}
      </button>

      {message ? <span className="text-sm text-wiki-muted">{message}</span> : null}
    </div>
  );
}
