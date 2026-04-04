"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublishReviewArticlesButton() {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState("");

  async function handlePublish() {
    setIsPublishing(true);
    setMessage("");

    try {
      const response = await fetch("/api/editor/articles/publish-review", {
        method: "POST"
      });
      const payload = (await response.json()) as {
        error?: string;
        updatedCount?: number;
      };

      if (!response.ok) {
        setMessage(payload.error ?? "No se pudieron publicar los artículos en review.");
        return;
      }

      setMessage(
        payload.updatedCount && payload.updatedCount > 0
          ? `Se publicaron ${payload.updatedCount} artículo(s) que estaban en review.`
          : "No había artículos en review para publicar."
      );
      router.refresh();
    } catch {
      setMessage("Falló la publicación masiva de artículos.");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPublishing}
        className="rounded-sm border border-wiki-blue bg-wiki-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPublishing ? "Publicando..." : "Pasar todo review a published"}
      </button>

      {message ? <p className="text-sm text-wiki-muted">{message}</p> : null}
    </div>
  );
}
