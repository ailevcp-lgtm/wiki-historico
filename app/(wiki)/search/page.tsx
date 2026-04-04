import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { getPublicWikiCopy, searchArticles } from "@/lib/repository";
import { applyCopyTemplate } from "@/lib/site-config/utils";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildMetadata,
  metadataBase,
  siteTitle
} from "@/lib/seo";
import { humanizeSlug, normalizeQueryParam } from "@/lib/utils";

function buildSearchTitle(query?: string) {
  return query ? `Búsqueda: ${query} | ${siteTitle}` : `Búsqueda | ${siteTitle}`;
}

function buildSearchDescription(query?: string) {
  if (query) {
    return `Resultados para "${query}" en la wiki de AILE. Explorá artículos, hitos, eras y países del escenario Histórico 2100.`;
  }

  return "Buscá artículos, hitos, eras y países del escenario Histórico 2100 en la wiki de AILE.";
}

export async function generateMetadata({
  searchParams
}: {
  searchParams?: Promise<{ q?: string | string[] }>;
}): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = normalizeQueryParam(resolvedSearchParams?.q);
  const title = buildSearchTitle(query);
  const description = buildSearchDescription(query ?? undefined);
  const search = query ? `q=${encodeURIComponent(query)}` : "";
  const fullPath = search ? `/search?${search}` : "/search";
  const metadata = buildMetadata({
    title,
    description,
    path: "/search",
    imagePath: "/opengraph-image",
    imageAlt: query ? `Búsqueda: ${query}` : "Búsqueda",
    keywords: ["búsqueda", "search", "AILE", "wiki", ...(query ? [query] : [])],
    noIndex: true
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

export default async function SearchPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = normalizeQueryParam(resolvedSearchParams?.q);
  const [copy, results] = await Promise.all([
    getPublicWikiCopy(),
    query ? searchArticles(query) : Promise.resolve([])
  ]);

  return (
    <section className="wiki-paper p-5 md:p-6">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Búsqueda", path: "/search" }
        ])}
      />
      <header className="border-b border-wiki-border pb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">{copy.search.eyebrow}</p>
        <h1 className="wiki-page-title mt-2">{copy.search.title}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
          {copy.search.description}
        </p>
      </header>

      <form action="/search" className="mt-6 flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={copy.search.placeholder}
          className="w-full rounded-sm border border-wiki-border px-3 py-2 outline-none focus:border-wiki-blue"
        />
        <button
          type="submit"
          className="rounded-sm border border-wiki-border bg-wiki-page px-4 py-2 font-semibold"
        >
          {copy.search.buttonLabel}
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {query && results.length === 0 ? (
          <p className="text-wiki-muted">
            {applyCopyTemplate(copy.search.noResultsTemplate, { query })}
          </p>
        ) : null}

        {!query ? <p className="text-wiki-muted">{copy.search.emptyQueryMessage}</p> : null}

        {results.map(({ article, excerpt }) => (
          <article key={article.slug} className="rounded-sm border border-wiki-border bg-white p-4">
            <div className="flex flex-wrap gap-2">
              <span className="wiki-badge">{article.type}</span>
              {article.yearStart ? <span className="wiki-badge">{article.yearStart}</span> : null}
              {article.eraSlug ? <span className="wiki-badge">{humanizeSlug(article.eraSlug)}</span> : null}
            </div>
            <h2 className="mt-3 font-heading text-2xl">
              <Link href={`/article/${article.slug}`} className="wiki-link-track">
                {article.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-wiki-muted">{excerpt}</p>
            {article.categorySlugs.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {article.categorySlugs.map((categorySlug) => (
                  <Link key={categorySlug} href={`/category/${categorySlug}`} className="wiki-badge">
                    {humanizeSlug(categorySlug)}
                  </Link>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
