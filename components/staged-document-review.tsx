"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useState, type ReactNode } from "react";

import { ArticleMarkdown } from "@/components/article-markdown";
import { CountryOrganSummary } from "@/components/country-presence-board";
import { CountryScorecard } from "@/components/country-scorecard";
import { Infobox } from "@/components/infobox";
import { TableOfContents } from "@/components/table-of-contents";
import { countryOrganDefinitions } from "@/lib/country-organs";
import { getCountryProfileMarkdown } from "@/lib/country-profile";
import {
  mapDraftToArticle,
  mapDraftToCountry,
  normalizeCountryDraftScoreVariable
} from "@/lib/content/draft-mappers";
import { countryScoreMetrics, trendOptions } from "@/lib/country-scores";
import { normalizeHitoId, type HitoReferenceIndex } from "@/lib/hito-references";
import { extractHeadings } from "@/lib/markdown";
import { applyCopyTemplate } from "@/lib/site-config/utils";
import { humanizeSlug } from "@/lib/utils";
import type {
  CountryDraftCandidate,
  CountryImportPreview,
  CountryScoreDraft,
  HitoDraftCandidate,
  HitoImportPreview,
  ImportIssue,
  ImportPreviewResult,
  UnknownImportPreview
} from "@/types/import";
import type { StagedSourceDocument } from "@/types/staging";
import type {
  ArticleType,
  Bloc,
  CountryOrganSlug,
  InfoboxData,
  PublicWikiCopy,
  TimelineEra
} from "@/types/wiki";

const articleTypes: ArticleType[] = [
  "event",
  "organization",
  "treaty",
  "technology",
  "geography",
  "society",
  "summit",
  "bloc",
  "conflict"
];

type HitoFormState = {
  title: string;
  slug: string;
  type: ArticleType;
  summary: string;
  eraSlug: string;
  hitoId: string;
  yearStart: string;
  yearEnd: string;
  categorySlugs: string;
  imageUrl: string;
  markdown: string;
  infoboxText: string;
};

type CountryScoreFormState = {
  variable: string;
  score: string;
  trend: CountryScoreDraft["trend"] | "";
  notes: string;
};

type CountryFormState = {
  name: string;
  slug: string;
  bloc: string;
  eraSlug: string;
  hitoReference: string;
  summary: string;
  flagUrl: string;
  mapUrl: string;
  profileMarkdown: string;
  organMemberships: CountryOrganSlug[];
  scores: CountryScoreFormState[];
};

export function StagedDocumentReview({
  articleTitles,
  hitoArticles,
  blocs,
  copy,
  document,
  eras
}: {
  articleTitles: Record<string, string>;
  hitoArticles: HitoReferenceIndex;
  blocs: Bloc[];
  copy: PublicWikiCopy;
  document: StagedSourceDocument;
  eras: TimelineEra[];
}) {
  if (document.normalizedPayload.kind === "hito") {
    return (
      <StagedHitoReview
        articleTitles={articleTitles}
        hitoArticles={hitoArticles}
        copy={copy}
        document={document}
        eras={eras}
        preview={document.normalizedPayload}
      />
    );
  }

  if (document.normalizedPayload.kind === "country") {
    return (
      <StagedCountryReview
        articleTitles={articleTitles}
        hitoArticles={hitoArticles}
        blocs={blocs}
        copy={copy}
        document={document}
        eras={eras}
        preview={document.normalizedPayload}
      />
    );
  }

  return <UnknownPayloadReview document={document} preview={document.normalizedPayload} />;
}

function StagedHitoReview({
  articleTitles,
  hitoArticles,
  copy,
  document,
  eras,
  preview
}: {
  articleTitles: Record<string, string>;
  hitoArticles: HitoReferenceIndex;
  copy: PublicWikiCopy;
  document: StagedSourceDocument;
  eras: TimelineEra[];
  preview: HitoImportPreview;
}) {
  const [form, setForm] = useState<HitoFormState>(() => createHitoFormState(preview.draft));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const deferredMarkdown = useDeferredValue(form.markdown);
  const infoboxResult = parseInfoboxText(form.infoboxText);
  const previewDraft = buildHitoDraft(
    form,
    preview.draft.sourceFields,
    infoboxResult.value,
    deferredMarkdown
  );
  const previewArticle = mapDraftToArticle(previewDraft);
  const previewHeadings = extractHeadings(previewArticle.content);
  const previewEra = eras.find((era) => era.slug === previewArticle.eraSlug);
  const previewHitoArticles =
    previewArticle.hitoId && previewArticle.title.trim()
      ? {
          ...hitoArticles,
          [normalizeHitoId(previewArticle.hitoId) ?? previewArticle.hitoId]: {
            slug: previewArticle.slug,
            title: previewArticle.title.trim(),
            href: `/admin/review/${document.id}`
          }
        }
      : hitoArticles;

  async function handleSave() {
    setError("");
    setMessage("");
    setIsSaving(true);

    if (!form.title.trim() || !form.slug.trim()) {
      setError("El borrador necesita al menos título y slug antes de guardarse.");
      setIsSaving(false);
      return;
    }

    if (infoboxResult.error) {
      setError(infoboxResult.error);
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/import/stage/${document.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          normalizedPayload: {
            ...preview,
            draft: buildHitoDraft(form, preview.draft.sourceFields, infoboxResult.value)
          } satisfies ImportPreviewResult
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "No se pudo guardar el borrador editorial.");
        return;
      }

      setMessage("Cambios guardados en la cola editorial. Aún no están publicados.");
    } catch {
      setError("Falló el guardado del borrador editorial.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <IssuePanel issues={preview.issues} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <section className="wiki-paper p-5 md:p-6">
          <header className="border-b border-wiki-border pb-5">
            <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">
              Vista previa editorial
            </p>
            <h2 className="font-heading text-3xl">Así se vería al publicarse</h2>
            <p className="mt-3 max-w-3xl text-sm text-wiki-muted">
              La preview usa la misma estructura visual que la wiki pública, pero sigue siendo un
              borrador staged.
            </p>
          </header>

          <article className="mt-6">
            <header className="border-b border-wiki-border pb-5">
              <div className="flex flex-wrap gap-2">
                <span className="wiki-badge">{previewArticle.type}</span>
                {previewEra ? (
                  <Link href={`/era/${previewEra.slug}`} className="wiki-badge">
                    Era {previewEra.number}
                  </Link>
                ) : null}
                <span className="wiki-badge">{formatYearRange(form.yearStart, form.yearEnd)}</span>
                {previewArticle.hitoId ? <span className="wiki-badge">{previewArticle.hitoId}</span> : null}
              </div>

              <h1 className="wiki-page-title mt-4">{previewArticle.title || "Sin título"}</h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
                {previewArticle.summary || "Agrega un resumen para completar la ficha."}
              </p>
            </header>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="order-2 xl:order-1">
                <ArticleMarkdown
                  articleTitles={articleTitles}
                  hitoArticles={previewHitoArticles}
                  markdown={previewArticle.content}
                />

                <section className="mt-10 border-t border-wiki-border pt-5">
                  <h2 className="font-heading text-2xl">{copy.articlePage.categoriesSectionTitle}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {previewArticle.categorySlugs.length > 0 ? (
                      previewArticle.categorySlugs.map((slug) => (
                        <Link key={slug} href={`/category/${slug}`} className="wiki-badge">
                          {humanizeSlug(slug)}
                        </Link>
                      ))
                    ) : (
                      <span className="text-sm text-wiki-muted">Sin categorías asignadas.</span>
                    )}
                  </div>
                </section>
              </div>

              <div className="order-1 space-y-4 xl:order-2">
                <TableOfContents
                  headings={previewHeadings}
                  title={copy.articlePage.tableOfContentsTitle}
                />
                <Infobox
                  articleTitles={articleTitles}
                  data={previewArticle.infobox}
                  imageUrl={previewArticle.imageUrl}
                  title={previewArticle.title || "Borrador"}
                />
              </div>
            </div>
          </article>
        </section>

        <section className="wiki-paper self-start p-5 md:p-6 xl:sticky xl:top-6">
          <header className="border-b border-wiki-border pb-5">
            <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Editar borrador</p>
            <h2 className="font-heading text-3xl">Correcciones antes de promover</h2>
            <p className="mt-3 text-sm text-wiki-muted">
              Lo que ajustes aquí se guarda en staging y luego se usa al promover a la wiki.
            </p>
          </header>

          <div className="mt-5 space-y-4">
            <Field label="Título">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Slug">
                <input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                />
              </Field>

              <Field label="Tipo">
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, type: event.target.value as ArticleType }))
                  }
                  className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                >
                  {articleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Era">
                <select
                  value={form.eraSlug}
                  onChange={(event) => setForm((current) => ({ ...current, eraSlug: event.target.value }))}
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
                  value={form.hitoId}
                  onChange={(event) => setForm((current) => ({ ...current, hitoId: event.target.value }))}
                  className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Año inicio">
                <input
                  type="number"
                  value={form.yearStart}
                  onChange={(event) => setForm((current) => ({ ...current, yearStart: event.target.value }))}
                  className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                />
              </Field>

              <Field label="Año fin">
                <input
                  type="number"
                  value={form.yearEnd}
                  onChange={(event) => setForm((current) => ({ ...current, yearEnd: event.target.value }))}
                  className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                />
              </Field>
            </div>

            <Field label="Resumen">
              <textarea
                value={form.summary}
                onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                className="min-h-24 w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              />
            </Field>

            <Field label="Categorías (separadas por coma)">
              <input
                value={form.categorySlugs}
                onChange={(event) =>
                  setForm((current) => ({ ...current, categorySlugs: event.target.value }))
                }
                className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              />
            </Field>

            <Field label="Imagen URL">
              <input
                value={form.imageUrl}
                onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                placeholder="https://... o /images/..."
              />
            </Field>

            <Field label="Infobox JSON">
              <textarea
                value={form.infoboxText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, infoboxText: event.target.value }))
                }
                className="min-h-40 w-full rounded-sm border border-wiki-border bg-white px-3 py-3 font-mono text-sm leading-6"
              />
            </Field>
            {infoboxResult.error ? <InlineError message={infoboxResult.error} /> : null}

            <Field label="Markdown">
              <textarea
                value={form.markdown}
                onChange={(event) => setForm((current) => ({ ...current, markdown: event.target.value }))}
                className="min-h-[320px] w-full rounded-sm border border-wiki-border bg-white px-3 py-3 font-mono text-sm leading-6"
              />
            </Field>

            <div className="rounded-sm border border-wiki-border bg-wiki-page p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">
                Guardado staged
              </div>
              {error ? <p className="mt-3 text-sm font-semibold text-wiki-red">{error}</p> : null}
              {message ? <p className="mt-3 text-sm text-wiki-muted">{message}</p> : null}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="mt-4 rounded-sm border border-wiki-blue bg-wiki-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : "Guardar borrador en cola editorial"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <ParserDetails preview={preview} />
    </div>
  );
}

function StagedCountryReview({
  articleTitles,
  hitoArticles,
  blocs,
  copy,
  document,
  eras,
  preview
}: {
  articleTitles: Record<string, string>;
  hitoArticles: HitoReferenceIndex;
  blocs: Bloc[];
  copy: PublicWikiCopy;
  document: StagedSourceDocument;
  eras: TimelineEra[];
  preview: CountryImportPreview;
}) {
  const [form, setForm] = useState<CountryFormState>(() => createCountryFormState(preview.draft));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const deferredProfileMarkdown = useDeferredValue(form.profileMarkdown);
  const previewDraft = buildCountryDraft(form, preview.draft.historicalScores, deferredProfileMarkdown);
  const previewCountry = mapDraftToCountry(previewDraft);
  const previewSummary = previewCountry.summary || copy.countryPage.summaryFallback;
  const previewProfileMarkdown = getCountryProfileMarkdown(
    deferredProfileMarkdown || copy.countryPage.profileFallbackMarkdown,
    { stripImages: Boolean(previewCountry.mapUrl) }
  );

  async function handleSave() {
    setError("");
    setMessage("");
    setIsSaving(true);

    if (!form.name.trim() || !form.slug.trim()) {
      setError("El borrador necesita nombre y slug antes de guardarse.");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/import/stage/${document.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          normalizedPayload: {
            ...preview,
            draft: buildCountryDraft(form, preview.draft.historicalScores)
          } satisfies ImportPreviewResult
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "No se pudo guardar el borrador editorial.");
        return;
      }

      setMessage("Cambios guardados en la cola editorial. Aún no están publicados.");
    } catch {
      setError("Falló el guardado del borrador editorial.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <IssuePanel issues={preview.issues} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <section className="wiki-paper p-5 md:p-6">
          <header className="border-b border-wiki-border pb-5">
            <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">
              Vista previa editorial
            </p>
            <h2 className="font-heading text-3xl">Así se vería la ficha publicada</h2>
            <p className="mt-3 max-w-3xl text-sm text-wiki-muted">
              La preview reproduce la composición principal de la ficha pública del país o región.
            </p>
          </header>

          <div className="mt-6 space-y-6">
            <section className="wiki-paper p-5">
              <header className="border-b border-wiki-border pb-5">
                <div className="flex flex-wrap gap-2">
                  <span className="wiki-badge">{copy.countryPage.badgeLabel}</span>
                  {previewCountry.bloc ? (
                    <span className="wiki-badge">{humanizeSlug(previewCountry.bloc)}</span>
                  ) : null}
                  <CountryOrganSummary
                    country={previewCountry}
                    emptyLabel={copy.countryPage.noOrgansBadgeLabel}
                  />
                  <span className="wiki-badge">
                    {applyCopyTemplate(copy.countryPage.snapshotBadgeTemplate, {
                      count: previewCountry.scores.length
                    })}
                  </span>
                </div>
                <h1 className="wiki-page-title mt-4">{previewCountry.name || "Sin nombre"}</h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">{previewSummary}</p>
              </header>

              <div className="mt-6 space-y-6">
                {previewCountry.flagUrl ? (
                  <section className="wiki-paper p-5">
                    <h2 className="font-heading text-2xl">Representante</h2>
                    <div className="mt-4 mx-auto max-w-sm overflow-hidden rounded-sm border border-wiki-border bg-white">
                      <Image
                        src={previewCountry.flagUrl}
                        alt={`Foto del representante de ${previewCountry.name || "la ficha"}`}
                        width={640}
                        height={800}
                        className="h-auto w-full object-contain"
                      />
                    </div>
                  </section>
                ) : null}

                {previewCountry.mapUrl ? (
                  <section className="wiki-paper p-5">
                    <h2 className="font-heading text-2xl">{copy.countryPage.mapSectionTitle}</h2>
                    <div className="mt-4 overflow-hidden rounded-sm border border-wiki-border bg-white">
                      <Image
                        src={previewCountry.mapUrl}
                        alt={`Mapa de ${previewCountry.name || "la ficha"}`}
                        width={960}
                        height={720}
                        className="h-auto w-full object-contain"
                      />
                    </div>
                  </section>
                ) : null}

                <section className="wiki-paper p-5">
                  <h2 className="font-heading text-2xl">{copy.countryPage.profileSectionTitle}</h2>
                  <div className="mt-4">
                    <ArticleMarkdown
                      articleTitles={articleTitles}
                      hitoArticles={hitoArticles}
                      markdown={previewProfileMarkdown}
                    />
                  </div>
                </section>

                <CountryScorecard
                  country={previewCountry}
                  copy={copy.countryScorecard}
                  eras={eras}
                  hitoArticles={hitoArticles}
                />
              </div>
            </section>
          </div>
        </section>

        <section className="wiki-paper self-start p-5 md:p-6 xl:sticky xl:top-6">
          <header className="border-b border-wiki-border pb-5">
            <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Editar borrador</p>
            <h2 className="font-heading text-3xl">Correcciones antes de promover</h2>
            <p className="mt-3 text-sm text-wiki-muted">
              Puedes corregir nombre, narrativa, mapa, órganos y snapshot actual sin salir de la
              cola editorial.
            </p>
          </header>

          <div className="mt-5 space-y-4">
            <Field label="Nombre">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Slug">
                <input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                />
              </Field>

              <Field label="Bloque">
                <select
                  value={form.bloc}
                  onChange={(event) => setForm((current) => ({ ...current, bloc: event.target.value }))}
                  className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                >
                  <option value="">Sin bloque</option>
                  {blocs.map((bloc) => (
                    <option key={bloc.slug} value={bloc.slug}>
                      {bloc.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Era">
                <select
                  value={form.eraSlug}
                  onChange={(event) => setForm((current) => ({ ...current, eraSlug: event.target.value }))}
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

              <Field label="Hito de referencia">
                <input
                  value={form.hitoReference}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, hitoReference: event.target.value }))
                  }
                  className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                />
              </Field>
            </div>

            <Field label="Resumen">
              <textarea
                value={form.summary}
                onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                className="min-h-24 w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              />
            </Field>

            <Field label="Foto del representante URL">
              <input
                value={form.flagUrl}
                onChange={(event) => setForm((current) => ({ ...current, flagUrl: event.target.value }))}
                className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                placeholder="https://... o /images/..."
              />
            </Field>

            <Field label="Mapa URL">
              <input
                value={form.mapUrl}
                onChange={(event) => setForm((current) => ({ ...current, mapUrl: event.target.value }))}
                className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                placeholder="https://... o /images/..."
              />
            </Field>

            <div className="rounded-sm border border-wiki-border bg-wiki-page p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">
                Presencia por órgano
              </div>
              <div className="mt-4 grid gap-3">
                {countryOrganDefinitions.map((organ) => {
                  const isActive = form.organMemberships.includes(organ.slug);
                  return (
                    <label
                      key={organ.slug}
                      className={`rounded-sm border px-3 py-3 ${
                        isActive ? "border-[#5b1739] bg-[#f8e1e6]" : "border-wiki-border bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleOrgan(setForm, organ.slug)}
                        />
                        <div>
                          <div className="font-semibold text-wiki-text">{organ.label}</div>
                          <div className="text-sm text-wiki-muted">
                            {organ.subtitle ? `Órgano ${organ.subtitle}.` : "Órgano principal."}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <Field label="Perfil narrativo">
              <textarea
                value={form.profileMarkdown}
                onChange={(event) =>
                  setForm((current) => ({ ...current, profileMarkdown: event.target.value }))
                }
                className="min-h-[260px] w-full rounded-sm border border-wiki-border bg-white px-3 py-3 font-mono text-sm leading-6"
              />
            </Field>

            <div className="rounded-sm border border-wiki-border bg-wiki-page p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">
                    Snapshot actual
                  </div>
                  <p className="mt-1 text-sm text-wiki-muted">
                    Los snapshots históricos preservados siguen en el borrador:{" "}
                    {preview.draft.historicalScores?.length ?? 0}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {form.scores.map((score, index) => (
                  <div key={score.variable} className="rounded-sm border border-wiki-border bg-white p-3">
                    <div className="font-semibold text-wiki-text">{score.variable}</div>
                    <div className="mt-3 grid gap-3 md:grid-cols-[120px_150px_minmax(0,1fr)]">
                      <Field label="Puntaje">
                        <select
                          value={score.score}
                          onChange={(event) =>
                            updateCountryScoreField(setForm, index, "score", event.target.value)
                          }
                          className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                        >
                          <option value="">Sin dato</option>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <option key={value} value={String(value)}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Tendencia">
                        <select
                          value={score.trend}
                          onChange={(event) =>
                            updateCountryScoreField(
                              setForm,
                              index,
                              "trend",
                              event.target.value as CountryScoreDraft["trend"] | ""
                            )
                          }
                          className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                        >
                          <option value="">Sin dato</option>
                          {trendOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Notas">
                        <input
                          value={score.notes}
                          onChange={(event) =>
                            updateCountryScoreField(setForm, index, "notes", event.target.value)
                          }
                          className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-sm border border-wiki-border bg-wiki-page p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">
                Guardado staged
              </div>
              {error ? <p className="mt-3 text-sm font-semibold text-wiki-red">{error}</p> : null}
              {message ? <p className="mt-3 text-sm text-wiki-muted">{message}</p> : null}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="mt-4 rounded-sm border border-wiki-blue bg-wiki-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : "Guardar borrador en cola editorial"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <ParserDetails preview={preview} />
    </div>
  );
}

function UnknownPayloadReview({
  document,
  preview
}: {
  document: StagedSourceDocument;
  preview: UnknownImportPreview;
}) {
  return (
    <section className="wiki-paper p-5 md:p-6">
      <h2 className="font-heading text-2xl">Payload técnico</h2>
      <p className="mt-3 text-sm text-wiki-muted">
        Este documento quedó con tipo `unknown`, así que todavía no puedo mostrar una preview de
        publicación. Mantengo el payload crudo para inspección manual.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-sm border border-wiki-border bg-wiki-page p-4 text-sm whitespace-pre-wrap">
        {JSON.stringify(
          {
            detectedKind: document.detectedKind,
            normalizedPayload: preview
          },
          null,
          2
        )}
      </pre>
    </section>
  );
}

function IssuePanel({ issues }: { issues: ImportIssue[] }) {
  return (
    <section className="wiki-paper p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Validaciones</p>
          <h2 className="font-heading text-3xl">Observaciones del parser</h2>
        </div>
        <span className="wiki-badge">{issues.length} observación(es)</span>
      </div>

      <div className="mt-5 space-y-2">
        {issues.length === 0 ? (
          <p className="text-sm text-wiki-muted">
            Sin observaciones. El borrador quedó consistente para revisión editorial.
          </p>
        ) : (
          issues.map((issue, index) => (
            <div
              key={`${issue.level}-${issue.field ?? "general"}-${index}`}
              className="rounded-sm border border-wiki-border bg-wiki-page px-3 py-2 text-sm"
            >
              <strong className="uppercase">{issue.level}</strong>
              {issue.field ? ` · ${issue.field}` : ""}: {issue.message}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ParserDetails({
  preview
}: {
  preview: HitoImportPreview | CountryImportPreview;
}) {
  return (
    <details className="wiki-paper p-5 md:p-6">
      <summary className="cursor-pointer font-heading text-2xl">Detalle técnico del parser</summary>
      <p className="mt-3 text-sm text-wiki-muted">
        Este bloque conserva el material de diagnóstico por si necesitas volver a mirar la
        extracción original.
      </p>

      {"extractedFields" in preview && Object.keys(preview.extractedFields).length > 0 ? (
        <section className="mt-5">
          <h3 className="font-heading text-xl">Campos detectados</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {Object.entries(preview.extractedFields).map(([key, value]) => (
              <StaticField key={key} label={key} value={value} />
            ))}
          </div>
        </section>
      ) : null}

      {"extractedSections" in preview && Object.keys(preview.extractedSections).length > 0 ? (
        <section className="mt-5">
          <h3 className="font-heading text-xl">Secciones extraídas</h3>
          <div className="mt-3 space-y-3">
            {Object.entries(preview.extractedSections).map(([key, values]) => (
              <div key={key} className="rounded-sm border border-wiki-border bg-wiki-page p-3">
                <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">{key}</div>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-wiki-text">
                  {values.join("\n")}
                </pre>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {"extractedNarrative" in preview && Object.keys(preview.extractedNarrative).length > 0 ? (
        <section className="mt-5">
          <h3 className="font-heading text-xl">Narrativa extraída</h3>
          <div className="mt-3 space-y-3">
            {Object.entries(preview.extractedNarrative).map(([key, value]) => (
              <div key={key} className="rounded-sm border border-wiki-border bg-wiki-page p-3">
                <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">{key}</div>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-wiki-text">{value}</pre>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5">
        <h3 className="font-heading text-xl">Payload JSON</h3>
        <pre className="mt-3 overflow-x-auto rounded-sm border border-wiki-border bg-wiki-page p-4 text-sm whitespace-pre-wrap">
          {JSON.stringify(preview, null, 2)}
        </pre>
      </section>
    </details>
  );
}

function Field({
  children,
  label
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs uppercase tracking-[0.12em] text-wiki-muted">{label}</div>
      {children}
    </label>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="rounded-sm border border-[#b32424] bg-[#fbeaea] px-3 py-2 text-sm text-[#7b1f1f]">
      {message}
    </div>
  );
}

function StaticField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-sm border border-wiki-border bg-wiki-page p-3">
      <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">{label}</div>
      <div className="mt-1 text-sm text-wiki-text">{value || "Sin detectar"}</div>
    </div>
  );
}

function createHitoFormState(draft: HitoDraftCandidate): HitoFormState {
  return {
    title: draft.title,
    slug: draft.slug,
    type: draft.type,
    summary: draft.summary,
    eraSlug: draft.eraSlug ?? "",
    hitoId: draft.hitoId ?? "",
    yearStart: draft.yearStart?.toString() ?? "",
    yearEnd: draft.yearEnd?.toString() ?? "",
    categorySlugs: draft.categorySlugs.join(", "),
    imageUrl: draft.imageUrl ?? "",
    markdown: draft.markdown,
    infoboxText: draft.infobox ? JSON.stringify(draft.infobox, null, 2) : ""
  };
}

function buildHitoDraft(
  form: HitoFormState,
  sourceFields: HitoDraftCandidate["sourceFields"],
  infobox?: InfoboxData,
  markdownOverride?: string
): HitoDraftCandidate {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    type: form.type,
    summary: form.summary.trim(),
    eraSlug: form.eraSlug || undefined,
    hitoId: form.hitoId.trim() || undefined,
    yearStart: parseOptionalNumber(form.yearStart),
    yearEnd: parseOptionalNumber(form.yearEnd),
    categorySlugs: normalizeCommaList(form.categorySlugs),
    infobox,
    imageUrl: form.imageUrl.trim() || undefined,
    markdown: markdownOverride ?? form.markdown,
    sourceFields
  };
}

function createCountryFormState(draft: CountryDraftCandidate): CountryFormState {
  return {
    name: draft.name,
    slug: draft.slug,
    bloc: draft.bloc ?? "",
    eraSlug: draft.eraSlug ?? "",
    hitoReference: draft.hitoReference ?? "",
    summary: draft.summary,
    flagUrl: draft.flagUrl ?? "",
    mapUrl: draft.mapUrl ?? "",
    profileMarkdown: draft.profileMarkdown,
    organMemberships: draft.organMemberships ?? [],
    scores: countryScoreMetrics.map((metric) => {
      const matchingScore = draft.scores.find(
        (score) =>
          normalizeCountryDraftScoreVariable(score.variable) ===
          normalizeCountryDraftScoreVariable(metric.label)
      );

      return {
        variable: metric.label,
        score: matchingScore?.score?.toString() ?? "",
        trend: matchingScore?.trend ?? "",
        notes: matchingScore?.notes ?? ""
      };
    })
  };
}

function buildCountryDraft(
  form: CountryFormState,
  historicalScores?: CountryDraftCandidate["historicalScores"],
  profileMarkdownOverride?: string
): CountryDraftCandidate {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    bloc: form.bloc || undefined,
    hitoReference: form.hitoReference.trim() || undefined,
    eraSlug: form.eraSlug || undefined,
    summary: form.summary.trim(),
    profileMarkdown: profileMarkdownOverride ?? form.profileMarkdown,
    flagUrl: form.flagUrl.trim() || undefined,
    mapUrl: form.mapUrl.trim() || undefined,
    organMemberships: form.organMemberships,
    scores: form.scores
      .map((score) => ({
        variable: score.variable,
        score: parseOptionalNumber(score.score),
        trend: score.trend || undefined,
        notes: score.notes.trim() || undefined
      }))
      .filter((score) => score.score !== undefined || score.trend || score.notes),
    historicalScores
  };
}

function toggleOrgan(
  setForm: React.Dispatch<React.SetStateAction<CountryFormState>>,
  organSlug: CountryOrganSlug
) {
  setForm((current) => ({
    ...current,
    organMemberships: current.organMemberships.includes(organSlug)
      ? current.organMemberships.filter((entry) => entry !== organSlug)
      : countryOrganDefinitions
          .map((organ) => organ.slug)
          .filter((entry) => entry === organSlug || current.organMemberships.includes(entry))
  }));
}

function updateCountryScoreField(
  setForm: React.Dispatch<React.SetStateAction<CountryFormState>>,
  index: number,
  key: keyof CountryScoreFormState,
  value: string | undefined
) {
  setForm((current) => ({
    ...current,
    scores: current.scores.map((score, scoreIndex) =>
      scoreIndex === index
        ? {
            ...score,
            [key]: value ?? ""
          }
        : score
    )
  }));
}

function parseInfoboxText(text: string): { value?: InfoboxData; error?: string } {
  if (!text.trim()) {
    return {};
  }

  try {
    return {
      value: JSON.parse(text) as InfoboxData
    };
  } catch {
    return {
      error: "El infobox debe mantenerse como JSON válido para poder guardarlo."
    };
  }
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatYearRange(yearStart: string, yearEnd: string) {
  if (!yearStart.trim() && !yearEnd.trim()) {
    return "Sin fecha";
  }

  if (!yearEnd.trim()) {
    return yearStart.trim();
  }

  return `${yearStart.trim()} - ${yearEnd.trim()}`;
}
