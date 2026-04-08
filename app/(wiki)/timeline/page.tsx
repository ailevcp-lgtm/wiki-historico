import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { ReadingProgressBadge } from "@/components/reading-progress";
import { articleTypeLabelEs } from "@/lib/article-type-label";
import { getNavigationData, getPublicWikiCopy, getPublishedArticles } from "@/lib/repository";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
  buildMetadata,
  metadataBase,
  siteTitle
} from "@/lib/seo";
import { formatYearRange, humanizeSlug, normalizeQueryParam } from "@/lib/utils";

function buildTimelineTitle(params: { era?: string }) {
  const labels = [params.era]
    .filter((value): value is string => Boolean(value))
    .map((value) => humanizeSlug(value));

  return labels.length > 0
    ? `Línea del tiempo del escenario - ${labels.join(" - ")} | ${siteTitle}`
    : `Línea del tiempo del escenario | ${siteTitle}`;
}

function buildTimelineDescription(copyDescription: string, params: { era?: string }) {
  const filters = [params.era]
    .filter((value): value is string => Boolean(value))
    .map((value) => humanizeSlug(value));

  if (filters.length === 0) {
    return copyDescription;
  }

  return `${copyDescription} Vista filtrada por ${filters.join(", ")}.`;
}

export async function generateMetadata({
  searchParams
}: {
  searchParams?: Promise<{ era?: string | string[] }>;
}): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedEra = normalizeQueryParam(resolvedSearchParams?.era);
  const copy = await getPublicWikiCopy();
  const query = new URLSearchParams();

  if (selectedEra) {
    query.set("era", selectedEra);
  }

  const search = query.toString();
  const canonicalPath = "/timeline";
  const fullPath = search ? `${canonicalPath}?${search}` : canonicalPath;
  const title = buildTimelineTitle({ era: selectedEra });
  const description = buildTimelineDescription(copy.timeline.description, { era: selectedEra ?? undefined });
  const metadata = buildMetadata({
    title,
    description,
    path: canonicalPath,
    imageAlt: copy.timeline.title,
    keywords: ["linea del tiempo", "cronologia", "hitos", "AILE", "wiki"],
    noIndex: Boolean(search)
  });

  return {
    metadataBase,
    ...metadata,
    title: { absolute: title },
    openGraph: {
      ...(metadata.openGraph ?? {}),
      url: absoluteUrl(fullPath)
    }
  };
}

export default async function TimelinePage({
  searchParams
}: {
  searchParams?: Promise<{ era?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedEra = normalizeQueryParam(resolvedSearchParams?.era);
  const [{ eras }, articles, copy] = await Promise.all([
    getNavigationData(),
    getPublishedArticles(),
    getPublicWikiCopy()
  ]);
  const timeline = [...articles]
    .filter((article) => (selectedEra ? article.eraSlug === selectedEra : true))
    .sort((left, right) => (left.yearStart ?? 0) - (right.yearStart ?? 0));
  const title = buildTimelineTitle({ era: selectedEra });
  const description = buildTimelineDescription(copy.timeline.description, { era: selectedEra ?? undefined });

  return (
    <section className="wiki-paper p-5 md:p-6">
      <JsonLd
        data={[
          buildCollectionJsonLd({
            title,
            description,
            path: "/timeline"
          }),
          buildBreadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Línea del tiempo", path: "/timeline" }
          ])
        ]}
      />
      <header className="border-b border-wiki-border pb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">{copy.timeline.eyebrow}</p>
        <h1 className="wiki-page-title mt-2">
          {copy.timeline.title.replace(/timeline/gi, "Línea del tiempo")}
        </h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
          {copy.timeline.description}
        </p>
      </header>

      <form action="/timeline" className="mt-6 grid gap-3 rounded-sm border border-wiki-border bg-wiki-page p-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <select
          name="era"
          defaultValue={selectedEra}
          className="rounded-sm border border-wiki-border bg-white px-3 py-2 text-sm"
        >
          <option value="">{copy.timeline.allErasLabel}</option>
          {eras.map((era) => (
            <option key={era.slug} value={era.slug}>
              {copy.shell.eraLabelPrefix} {era.number}: {era.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold"
        >
          {copy.timeline.filterButtonLabel}
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {timeline.length === 0 ? (
          <p className="text-wiki-muted">{copy.timeline.emptyMessage}</p>
        ) : null}
        {timeline.map((article) => (
          <article
            key={article.slug}
            className="grid gap-4 rounded-sm border border-wiki-border bg-white p-4 md:grid-cols-[140px_minmax(0,1fr)]"
          >
            <div className="rounded-sm border border-wiki-border bg-wiki-page px-3 py-2 font-heading text-xl">
              {formatYearRange(article.yearStart, article.yearEnd)}
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                <span className="wiki-badge">{articleTypeLabelEs(article.type)}</span>
                {article.hitoId ? <ReadingProgressBadge slug={article.slug} /> : null}
              </div>
              <h2 className="mt-3 font-heading text-2xl">
                <Link href={`/article/${article.slug}`} className="wiki-link-track wiki-news-link">
                  {article.title}
                </Link>
              </h2>
              <p className="mt-2 text-wiki-muted">{article.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
