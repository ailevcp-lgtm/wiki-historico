"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { countryOrganDefinitions, getCountryOrganLabels } from "@/lib/country-organs";
import { countryScoreMetrics, trendOptions } from "@/lib/country-scores";
import type { Bloc, Country, CountryOrganSlug, CountryScore, TimelineEra } from "@/types/wiki";

interface CountryEditorFormProps {
  blocs: Bloc[];
  eras: TimelineEra[];
  initialCountry?: Country;
}

type ScoreFormState = {
  eraSlug: string;
  hitoId: string;
  climateExposure: string;
  climateTrend: CountryScore["climateTrend"] | "";
  stateCapacity: string;
  stateTrend: CountryScore["stateTrend"] | "";
  powerResources: string;
  powerTrend: CountryScore["powerTrend"] | "";
  techDependency: string;
  techTrend: CountryScore["techTrend"] | "";
  demographicPressure: string;
  demographicTrend: CountryScore["demographicTrend"] | "";
  socialCohesion: string;
  socialTrend: CountryScore["socialTrend"] | "";
  economicVulnerability: string;
  economicTrend: CountryScore["economicTrend"] | "";
  notes: string;
};

export function CountryEditorForm({
  blocs,
  eras,
  initialCountry
}: CountryEditorFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialCountry);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [slug, setSlug] = useState(initialCountry?.slug ?? "");
  const [name, setName] = useState(initialCountry?.name ?? "");
  const [bloc, setBloc] = useState(initialCountry?.bloc ?? "");
  const [summary, setSummary] = useState(initialCountry?.summary ?? "");
  const [flagUrl, setFlagUrl] = useState(initialCountry?.flagUrl ?? "");
  const [representativeUrl, setRepresentativeUrl] = useState(initialCountry?.representativeUrl ?? "");
  const [mapUrl, setMapUrl] = useState(initialCountry?.mapUrl ?? "");
  const [profileMarkdown, setProfileMarkdown] = useState(initialCountry?.profileMarkdown ?? "");
  const [organMemberships, setOrganMemberships] = useState<CountryOrganSlug[]>(
    initialCountry?.organMemberships ?? []
  );
  const [scores, setScores] = useState<ScoreFormState[]>(
    initialCountry?.scores.length ? initialCountry.scores.map(scoreToFormState) : [createEmptyScore()]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const payload: Country = {
      slug: slug.trim(),
      name: name.trim(),
      bloc: bloc || undefined,
      summary: summary.trim(),
      profileMarkdown,
      flagUrl: flagUrl.trim() || undefined,
      representativeUrl: representativeUrl.trim() || undefined,
      mapUrl: mapUrl.trim() || undefined,
      organMemberships,
      scores: scores.map(formStateToScore).filter(hasSnapshotContent)
    };

    try {
      const response = await fetch(
        isEdit ? `/api/editor/countries/${initialCountry?.slug}` : "/api/editor/countries",
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const responsePayload = (await response.json()) as { error?: string; slug?: string };

      if (!response.ok) {
        setError(responsePayload.error ?? "No se pudo guardar el país.");
        return;
      }

      setMessage("País guardado.");
      startTransition(() => {
        router.push(`/admin/countries/${responsePayload.slug ?? payload.slug}`);
        router.refresh();
      });
    } catch {
      setError("Falló el guardado del país.");
    }
  }

  function handleScoreChange(index: number, key: keyof ScoreFormState, value: string) {
    setScores((current) =>
      current.map((score, scoreIndex) =>
        scoreIndex === index
          ? {
              ...score,
              [key]: value
            }
          : score
      )
    );
  }

  function handleRemoveScore(index: number) {
    setScores((current) => (current.length === 1 ? [createEmptyScore()] : current.filter((_, scoreIndex) => scoreIndex !== index)));
  }

  function handleOrganToggle(organSlug: CountryOrganSlug) {
    setOrganMemberships((current) =>
      current.includes(organSlug)
        ? current.filter((entry) => entry !== organSlug)
        : countryOrganDefinitions
            .map((organ) => organ.slug)
            .filter((entry) => entry === organSlug || current.includes(entry))
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="wiki-paper p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Editor de países</p>
            <h1 className="wiki-page-title mt-2">
              {isEdit ? "Editar país o región" : "Nuevo país o región"}
            </h1>
          </div>
          {isEdit ? (
            <Link href={`/country/${initialCountry?.slug}`} className="wiki-link text-sm">
              Ver ficha pública
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Nombre">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              required
            />
          </Field>

          <Field label="Slug">
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2 disabled:bg-wiki-page"
              required
              readOnly={isEdit}
            />
          </Field>

          <Field label="Bloque">
            <select
              value={bloc}
              onChange={(event) => setBloc(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
            >
              <option value="">Sin bloque</option>
              {blocs.map((entry) => (
                <option key={entry.slug} value={entry.slug}>
                  {entry.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Bandera URL">
            <input
              value={flagUrl}
              onChange={(event) => setFlagUrl(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              placeholder="https://... o /images/..."
            />
          </Field>

          <Field label="Foto del representante / imagen URL">
            <input
              value={representativeUrl}
              onChange={(event) => setRepresentativeUrl(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              placeholder="https://... o /images/..."
            />
          </Field>

          <Field label="Mapa URL">
            <input
              value={mapUrl}
              onChange={(event) => setMapUrl(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              placeholder="https://... o /images/..."
            />
          </Field>
        </div>

        <Field className="mt-4" label="Resumen">
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="min-h-24 w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
          />
        </Field>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl">Presencia por órgano</h2>
            <p className="mt-2 text-sm text-wiki-muted">
              Define en qué órganos aparece este país dentro de la grilla pública.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {getCountryOrganLabels(organMemberships).map((label) => (
              <span key={label} className="wiki-badge">
                {label}
              </span>
            ))}
            {organMemberships.length === 0 ? <span className="wiki-badge">Sin órganos</span> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {countryOrganDefinitions.map((organ) => {
            const isActive = organMemberships.includes(organ.slug);

            return (
              <label
                key={organ.slug}
                className={`rounded-sm border px-4 py-4 ${
                  isActive ? "border-[#5b1739] bg-[#f8e1e6]" : "border-wiki-border bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => handleOrganToggle(organ.slug)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-heading text-2xl">{organ.label}</div>
                    <p className="text-sm text-wiki-muted">
                      {organ.subtitle ? `Órgano ${organ.subtitle}.` : "Órgano principal de la matriz."}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <h2 className="font-heading text-2xl">Perfil narrativo</h2>
        <textarea
          value={profileMarkdown}
          onChange={(event) => setProfileMarkdown(event.target.value)}
          className="mt-4 min-h-[300px] w-full rounded-sm border border-wiki-border bg-white px-3 py-3 font-mono text-sm leading-6"
        />
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl">Snapshots de puntajes</h2>
            <p className="mt-2 text-sm text-wiki-muted">
              Cada fila representa una evaluación por era o por hito.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScores((current) => [...current, createEmptyScore()])}
            className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold"
          >
            Agregar snapshot
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {scores.map((score, index) => (
            <article key={`score-${index}`} className="rounded-sm border border-wiki-border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-heading text-xl">Snapshot {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => handleRemoveScore(index)}
                  className="rounded-sm border border-wiki-border bg-wiki-page px-3 py-1.5 text-sm"
                >
                  Quitar
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Era">
                  <select
                    value={score.eraSlug}
                    onChange={(event) => handleScoreChange(index, "eraSlug", event.target.value)}
                    className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                  >
                    <option value="">Sin era</option>
                    {eras.map((era) => (
                      <option key={era.slug} value={era.slug}>
                        Era {era.number}: {era.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Hito ID">
                  <input
                    value={score.hitoId}
                    onChange={(event) => handleScoreChange(index, "hitoId", event.target.value)}
                    className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                    placeholder="H-010"
                  />
                </Field>

                <Field label="Notas">
                  <input
                    value={score.notes}
                    onChange={(event) => handleScoreChange(index, "notes", event.target.value)}
                    className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {countryScoreMetrics.map((metric) => (
                  <div key={`${metric.valueKey}-${index}`} className="rounded-sm border border-wiki-border bg-wiki-page p-3">
                    <div className="text-sm font-semibold text-wiki-text">{metric.label}</div>
                    <div className="mt-3 grid gap-3 md:grid-cols-[100px_minmax(0,1fr)]">
                      <Field label="Puntaje">
                        <input
                          type="number"
                          value={score[metric.valueKey] ?? ""}
                          onChange={(event) =>
                            handleScoreChange(index, metric.valueKey, event.target.value)
                          }
                          className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                          inputMode="numeric"
                          placeholder="1-5"
                          min={1}
                          max={5}
                        />
                      </Field>
                      <Field label="Tendencia">
                        <select
                          value={score[metric.trendKey] ?? ""}
                          onChange={(event) =>
                            handleScoreChange(index, metric.trendKey, event.target.value)
                          }
                          className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                        >
                          <option value="">Sin tendencia</option>
                          {trendOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar país"}
        </button>
        <Link href="/admin/countries" className="wiki-link text-sm">
          Volver a países
        </Link>
      </div>

      {error ? <p className="text-sm font-semibold text-wiki-red">{error}</p> : null}
      {message ? <p className="text-sm text-wiki-muted">{message}</p> : null}
    </form>
  );
}

function Field({
  children,
  className = "",
  label
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-wiki-muted">{label}</span>
      {children}
    </label>
  );
}

function createEmptyScore(): ScoreFormState {
  return {
    eraSlug: "",
    hitoId: "",
    climateExposure: "",
    climateTrend: "",
    stateCapacity: "",
    stateTrend: "",
    powerResources: "",
    powerTrend: "",
    techDependency: "",
    techTrend: "",
    demographicPressure: "",
    demographicTrend: "",
    socialCohesion: "",
    socialTrend: "",
    economicVulnerability: "",
    economicTrend: "",
    notes: ""
  };
}

function scoreToFormState(score: CountryScore): ScoreFormState {
  return {
    eraSlug: score.eraSlug ?? "",
    hitoId: score.hitoId ?? "",
    climateExposure: score.climateExposure?.toString() ?? "",
    climateTrend: score.climateTrend ?? "",
    stateCapacity: score.stateCapacity?.toString() ?? "",
    stateTrend: score.stateTrend ?? "",
    powerResources: score.powerResources?.toString() ?? "",
    powerTrend: score.powerTrend ?? "",
    techDependency: score.techDependency?.toString() ?? "",
    techTrend: score.techTrend ?? "",
    demographicPressure: score.demographicPressure?.toString() ?? "",
    demographicTrend: score.demographicTrend ?? "",
    socialCohesion: score.socialCohesion?.toString() ?? "",
    socialTrend: score.socialTrend ?? "",
    economicVulnerability: score.economicVulnerability?.toString() ?? "",
    economicTrend: score.economicTrend ?? "",
    notes: score.notes ?? ""
  };
}

function formStateToScore(score: ScoreFormState): CountryScore {
  return {
    eraSlug: score.eraSlug || undefined,
    hitoId: score.hitoId.trim() || undefined,
    climateExposure: normalizeScore(score.climateExposure),
    climateTrend: score.climateTrend || undefined,
    stateCapacity: normalizeScore(score.stateCapacity),
    stateTrend: score.stateTrend || undefined,
    powerResources: normalizeScore(score.powerResources),
    powerTrend: score.powerTrend || undefined,
    techDependency: normalizeScore(score.techDependency),
    techTrend: score.techTrend || undefined,
    demographicPressure: normalizeScore(score.demographicPressure),
    demographicTrend: score.demographicTrend || undefined,
    socialCohesion: normalizeScore(score.socialCohesion),
    socialTrend: score.socialTrend || undefined,
    economicVulnerability: normalizeScore(score.economicVulnerability),
    economicTrend: score.economicTrend || undefined,
    notes: score.notes.trim() || undefined
  };
}

function normalizeScore(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 1 && numeric <= 5 ? numeric : undefined;
}

function hasSnapshotContent(score: CountryScore) {
  return Boolean(
    score.eraSlug ||
      score.hitoId ||
      score.climateExposure ||
      score.stateCapacity ||
      score.powerResources ||
      score.techDependency ||
      score.demographicPressure ||
      score.socialCohesion ||
      score.economicVulnerability ||
      score.notes
  );
}
