"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const confirmationToken = "LIMPIAR";

export function ResetWikiContentButton() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState("");

  const isConfirmationValid = confirmation.trim().toUpperCase() === confirmationToken;

  async function handleReset() {
    if (!isConfirmationValid) {
      setMessage(`Escribe ${confirmationToken} para habilitar la limpieza.`);
      return;
    }

    setIsResetting(true);
    setMessage("");

    try {
      const response = await fetch("/api/editor/content/reset", {
        method: "POST"
      });
      const payload = (await response.json()) as {
        error?: string;
        removedArticles?: number;
        removedCountries?: number;
        removedStagedDocuments?: number;
      };

      if (!response.ok) {
        setMessage(payload.error ?? "No se pudo limpiar el contenido de pruebas.");
        return;
      }

      setConfirmation("");
      setMessage(
        `Limpieza completada: ${payload.removedArticles ?? 0} artículos, ${payload.removedCountries ?? 0} países editados y ${payload.removedStagedDocuments ?? 0} fichas staged.`
      );
      router.refresh();
    } catch {
      setMessage("Falló la limpieza del contenido de pruebas.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="rounded-sm border border-[#c68484] bg-[#fff5f4] p-4">
      <p className="text-sm font-semibold text-[#7a2f2f]">Limpiar contenido de pruebas</p>
      <p className="mt-2 text-sm leading-6 text-[#7a2f2f]">
        Borra artículos, overrides de países y la cola editorial para volver a una wiki vacía sin
        tocar configuración ni catálogos base.
      </p>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder={`Escribe ${confirmationToken}`}
          className="w-full rounded-sm border border-[#c68484] bg-white px-3 py-2 text-sm md:max-w-[220px]"
        />
        <button
          type="button"
          onClick={handleReset}
          disabled={isResetting}
          className="rounded-sm border border-[#a63b3b] bg-[#a63b3b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isResetting ? "Limpiando..." : "Limpiar wiki"}
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-[#7a2f2f]">{message}</p> : null}
    </div>
  );
}
