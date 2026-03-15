"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PromotionResult } from "@/types/staging";

export function PromoteSourceDocumentButton({
  documentId,
  disabled
}: {
  documentId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPromoting, setIsPromoting] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PromotionResult | null>(null);

  async function handlePromote() {
    setIsPromoting(true);
    setMessage("");

    try {
      const response = await fetch(`/api/import/stage/${documentId}/promote`, {
        method: "POST"
      });
      const payload = (await response.json()) as PromotionResult & { error?: string };

      if (!response.ok) {
        setResult(null);
        setMessage(payload.error ?? "No se pudo promover la ficha.");
        return;
      }

      setResult(payload);
      setMessage("Documento promovido a contenido wiki.");
      router.refresh();
    } catch {
      setResult(null);
      setMessage("Falló la promoción del documento.");
    } finally {
      setIsPromoting(false);
    }
  }

  return (
    <div className="rounded-sm border border-wiki-border bg-wiki-page p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">Promoción</div>
      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
        <button
          type="button"
          onClick={handlePromote}
          disabled={disabled || isPromoting}
          className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isPromoting ? "Promoviendo..." : "Promover a la wiki"}
        </button>

        {result ? (
          <Link href={result.targetPath} className="wiki-link text-sm">
            Abrir {result.detectedKind === "hito" ? "workflow del artículo" : "país"} resultante
          </Link>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm text-wiki-muted">{message}</p> : null}
    </div>
  );
}
