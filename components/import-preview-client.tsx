"use client";

import Link from "next/link";
import { useState } from "react";

import type { ImportPreviewResult } from "@/types/import";
import { resolveCountryFlagUrl } from "@/lib/country-assets";
import { mapDraftToCountry } from "@/lib/content/draft-mappers";

type BatchImportError = {
  fileName: string;
  error: string;
};

type HistoryImportSummary = {
  mode: "pilot" | "full";
  availableHitos: number;
  availableCountries: number;
  returnedHitos: number;
  returnedCountries: number;
};

export function ImportPreviewClient() {
  const [error, setError] = useState<string>("");
  const [batchErrors, setBatchErrors] = useState<BatchImportError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStaging, setIsStaging] = useState(false);
  const [stageMessage, setStageMessage] = useState("");
  const [sourceMessage, setSourceMessage] = useState("");
  const [results, setResults] = useState<ImportPreviewResult[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length === 0) {
      setError("Selecciona al menos un archivo .docx o .md antes de continuar.");
      setResults([]);
      setBatchErrors([]);
      setSourceMessage("");
      return;
    }

    setIsLoading(true);
    resetImportState();

    try {
      const batchFormData = new FormData();
      for (const file of files) {
        batchFormData.append("files", file);
      }

      const response = await fetch("/api/import/batch-preview", {
        method: "POST",
        body: batchFormData
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "No se pudo generar la vista previa.");
        return;
      }

      setResults(payload.results ?? []);
      setBatchErrors(payload.errors ?? []);
    } catch {
      setError("Falló la solicitud de importación. Revisa la conexión local e inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleHistoryImport(mode: "pilot" | "full") {
    setIsLoading(true);
    resetImportState();

    try {
      const response = await fetch("/api/import/history-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mode })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "No se pudo leer la carpeta HISTORIA.");
        return;
      }

      setResults(payload.results ?? []);
      setBatchErrors(payload.errors ?? []);
      setSourceMessage(buildHistoryImportMessage(payload.summary));
    } catch {
      setError("Falló la lectura local de la carpeta HISTORIA.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStageBatch() {
    if (results.length === 0) {
      return;
    }

    setIsStaging(true);
    setStageMessage("");

    try {
      const response = await fetch("/api/import/stage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ results })
      });

      const payload = await response.json();

      if (!response.ok) {
        setStageMessage(payload.error ?? "No se pudo guardar el lote.");
        return;
      }

      setStageMessage(`Lote guardado en staging: ${payload.stagedCount} documento(s).`);
    } catch {
      setStageMessage("Falló el guardado del lote en staging.");
    } finally {
      setIsStaging(false);
    }
  }

  function resetImportState() {
    setError("");
    setResults([]);
    setBatchErrors([]);
    setStageMessage("");
    setSourceMessage("");
  }

  return (
    <div className="space-y-6">
      <section className="wiki-paper p-5 md:p-6">
        <header className="border-b border-wiki-border pb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Fuente local</p>
          <h1 className="wiki-page-title mt-2">Importación directa desde HISTORIA</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
            Lee los documentos maestros del proyecto o la carpeta <code>HISTORIA/split</code>,
            separa hitos y países en previews individuales y deja el lote listo para pasar por la
            cola editorial.
          </p>
        </header>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleHistoryImport("pilot")}
            className="rounded-sm border border-wiki-border bg-white px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Procesando..." : "Cargar piloto (5 hitos + 5 países)"}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleHistoryImport("full")}
            className="rounded-sm border border-wiki-border bg-wiki-page px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Procesando..." : "Cargar lote completo"}
          </button>
        </div>

        <p className="mt-4 text-sm text-wiki-muted">
          Usa el piloto para validar nombres, mapas, órganos, puntajes y markdown antes de correr
          el lote completo desde los maestros o desde <code>HISTORIA/split</code>.
        </p>

        {sourceMessage ? <p className="mt-4 text-sm text-wiki-muted">{sourceMessage}</p> : null}
      </section>

      <form onSubmit={handleSubmit} className="wiki-paper p-5 md:p-6">
        <header className="border-b border-wiki-border pb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Carga manual</p>
          <h1 className="wiki-page-title mt-2">Vista previa de fichas .docx y .md</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
            Sube una ficha del CEA en formato <code>.docx</code> o <code>.md</code> y el sistema
            generará un borrador estructurado para la wiki antes de conectarlo con Supabase.
          </p>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="file"
            name="files"
            accept=".docx,.md,text/markdown"
            multiple
            className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-sm border border-wiki-border bg-wiki-page px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Procesando..." : "Generar preview"}
          </button>
        </div>

        <div className="mt-4 text-sm text-wiki-muted">
          El parser reconoce dos plantillas: <strong>Ficha de Hito</strong> y{" "}
          <strong>Ficha de País/Región</strong>. Puedes cargar varias fichas en un solo lote y usar
          los archivos separados en <code>.md</code>.
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-wiki-red">{error}</p> : null}
      </form>

      {batchErrors.length > 0 ? (
        <section className="wiki-paper p-5 md:p-6">
          <h2 className="font-heading text-2xl">Archivos rechazados</h2>
          <div className="mt-4 space-y-2">
            {batchErrors.map((entry) => (
              <div
                key={`${entry.fileName}-${entry.error}`}
                className="rounded-sm border border-wiki-border bg-wiki-page px-3 py-2 text-sm"
              >
                <strong>{entry.fileName}</strong>: {entry.error}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {results.length > 0 ? (
        <ImportBatchSummary
          results={results}
          isStaging={isStaging}
          onStage={handleStageBatch}
          stageMessage={stageMessage}
        />
      ) : null}
      {results.length > 0
        ? results.map((result, index) => <ImportResultView key={`${result.fileName}-${index}`} result={result} />)
        : null}
    </div>
  );
}

function ImportResultView({ result }: { result: ImportPreviewResult }) {
  return (
    <>
      <section className="wiki-paper p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="wiki-badge">{result.templateName}</span>
          <span className="wiki-badge">{result.kind}</span>
          <span className="text-sm text-wiki-muted">{result.fileName}</span>
          <button
            type="button"
            onClick={() => downloadPreview(result)}
            className="rounded-sm border border-wiki-border bg-white px-3 py-1.5 text-sm font-semibold"
          >
            Descargar JSON
          </button>
        </div>

        <div className="mt-5">
          <h2 className="font-heading text-2xl">Validaciones</h2>
          <div className="mt-3 space-y-2">
            {result.issues.length === 0 ? (
              <p className="text-sm text-wiki-muted">
                Sin observaciones. La ficha quedó lista para la siguiente capa.
              </p>
            ) : (
              result.issues.map((issue, index) => (
                <div
                  key={`${issue.level}-${index}`}
                  className="rounded-sm border border-wiki-border bg-wiki-page px-3 py-2 text-sm"
                >
                  <strong className="uppercase">{issue.level}</strong>
                  {issue.field ? ` · ${issue.field}` : ""}: {issue.message}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {result.kind === "hito" ? <HitoPreview result={result} /> : null}
      {result.kind === "country" ? <CountryPreview result={result} /> : null}

      <section className="wiki-paper p-5 md:p-6">
        <h2 className="font-heading text-2xl">Texto extraído</h2>
        <pre className="mt-4 overflow-x-auto rounded-sm border border-wiki-border bg-wiki-page p-4 text-sm whitespace-pre-wrap">
          {result.rawTextPreview}
        </pre>
      </section>
    </>
  );
}

function ImportBatchSummary({
  results,
  isStaging,
  onStage,
  stageMessage
}: {
  results: ImportPreviewResult[];
  isStaging: boolean;
  onStage: () => void;
  stageMessage: string;
}) {
  const hitos = results.filter((result) => result.kind === "hito").length;
  const countries = results.filter((result) => result.kind === "country").length;
  const unknown = results.filter((result) => result.kind === "unknown").length;
  const totalIssues = results.reduce((accumulator, result) => accumulator + result.issues.length, 0);

  return (
    <section className="wiki-paper p-5 md:p-6">
      <h2 className="font-heading text-2xl">Resumen del lote</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Field label="Registros" value={String(results.length)} />
        <Field label="Hitos" value={String(hitos)} />
        <Field label="Países" value={String(countries)} />
        <Field label="No reconocidos" value={String(unknown)} />
      </div>
      <p className="mt-4 text-sm text-wiki-muted">
        Observaciones detectadas en el lote: <strong>{totalIssues}</strong>
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onStage}
          disabled={isStaging}
          className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isStaging ? "Guardando..." : "Guardar lote en cola editorial"}
        </button>
        <Link href="/admin/review" className="wiki-link text-sm">
          Abrir cola editorial
        </Link>
      </div>
      {stageMessage ? <p className="mt-3 text-sm text-wiki-muted">{stageMessage}</p> : null}
    </section>
  );
}

function HitoPreview({ result }: { result: Extract<ImportPreviewResult, { kind: "hito" }> }) {
  return (
    <>
      <section className="wiki-paper p-5 md:p-6">
        <h2 className="font-heading text-2xl">Borrador de artículo</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Título" value={result.draft.title} />
          <Field label="Slug" value={result.draft.slug} />
          <Field label="Tipo" value={result.draft.type} />
          <Field label="Era" value={result.draft.eraSlug} />
          <Field label="Hito" value={result.draft.hitoId} />
          <Field
            label="Años"
            value={
              result.draft.yearStart
                ? `${result.draft.yearStart}${result.draft.yearEnd ? ` - ${result.draft.yearEnd}` : ""}`
                : undefined
            }
          />
        </div>

        <div className="mt-5">
          <h3 className="font-heading text-xl">Resumen</h3>
          <p className="mt-2 text-wiki-muted">{result.draft.summary}</p>
        </div>

        <div className="mt-5">
          <h3 className="font-heading text-xl">Markdown generado</h3>
          <pre className="mt-3 overflow-x-auto rounded-sm border border-wiki-border bg-wiki-page p-4 text-sm whitespace-pre-wrap">
            {result.draft.markdown}
          </pre>
        </div>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <h2 className="font-heading text-2xl">Campos detectados</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.entries(result.extractedFields).map(([key, value]) => (
            <Field key={key} label={key} value={value} />
          ))}
        </div>
      </section>
    </>
  );
}

function CountryPreview({ result }: { result: Extract<ImportPreviewResult, { kind: "country" }> }) {
  const resolvedFlagUrl = resolveCountryFlagUrl(mapDraftToCountry(result.draft));

  return (
    <>
      <section className="wiki-paper p-5 md:p-6">
        <h2 className="font-heading text-2xl">Borrador de país/región</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Nombre" value={result.draft.name} />
          <Field label="Slug" value={result.draft.slug} />
          <Field label="Bloque" value={result.draft.bloc} />
          <Field label="Era" value={result.draft.eraSlug} />
          <Field label="Hito de referencia" value={result.draft.hitoReference} />
          <Field label="Bandera" value={resolvedFlagUrl} />
          <Field label="Foto representante" value={result.draft.representativeUrl} />
          <Field label="Mapa" value={result.draft.mapUrl} />
          <Field
            label="Snapshots históricos"
            value={result.draft.historicalScores?.length ? String(result.draft.historicalScores.length) : undefined}
          />
        </div>

        <div className="mt-5">
          <h3 className="font-heading text-xl">Resumen</h3>
          <p className="mt-2 text-wiki-muted">{result.draft.summary}</p>
        </div>

        <div className="mt-5">
          <h3 className="font-heading text-xl">Perfil narrativo</h3>
          <pre className="mt-3 overflow-x-auto rounded-sm border border-wiki-border bg-wiki-page p-4 text-sm whitespace-pre-wrap">
            {result.draft.profileMarkdown}
          </pre>
        </div>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <h2 className="font-heading text-2xl">Puntajes detectados</h2>
        <div className="mt-4 space-y-3">
          {result.draft.scores.map((score) => (
            <div key={score.variable} className="rounded-sm border border-wiki-border bg-white p-4">
              <div className="font-semibold text-wiki-text">{score.variable}</div>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <Field label="Puntaje" value={score.score?.toString()} />
                <Field label="Tendencia" value={score.trend} />
                <Field label="Notas" value={score.notes} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-sm border border-wiki-border bg-wiki-page p-3">
      <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">{label}</div>
      <div className="mt-1 text-sm text-wiki-text">{value || "Sin detectar"}</div>
    </div>
  );
}

function downloadPreview(result: ImportPreviewResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${result.fileName
    .replace(/\.docx/gi, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")}.preview.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildHistoryImportMessage(summary?: HistoryImportSummary) {
  if (!summary) {
    return "";
  }

  if (summary.mode === "pilot") {
    return `Piloto generado desde HISTORIA: ${summary.returnedHitos} hitos y ${summary.returnedCountries} países. Lote completo disponible: ${summary.availableHitos} hitos y ${summary.availableCountries} países.`;
  }

  return `Lote completo generado desde HISTORIA: ${summary.returnedHitos} hitos y ${summary.returnedCountries} países listos para staging.`;
}
