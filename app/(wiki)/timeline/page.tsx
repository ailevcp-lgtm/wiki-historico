import Link from "next/link";

import { getNavigationData, getPublishedArticles } from "@/lib/repository";
import { formatYearRange, normalizeQueryParam, startCase } from "@/lib/utils";

export default async function TimelinePage({
  searchParams
}: {
  searchParams?: Promise<{ era?: string | string[]; type?: string | string[]; bloc?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedEra = normalizeQueryParam(resolvedSearchParams?.era);
  const selectedType = normalizeQueryParam(resolvedSearchParams?.type);
  const selectedBloc = normalizeQueryParam(resolvedSearchParams?.bloc);
  const { blocs, eras } = getNavigationData();
  const articles = await getPublishedArticles();
  const articleTypes = [...new Set(articles.map((article) => article.type))];
  const timeline = [...articles]
    .filter((article) => (selectedEra ? article.eraSlug === selectedEra : true))
    .filter((article) => (selectedType ? article.type === selectedType : true))
    .filter((article) => (selectedBloc ? article.blocSlugs?.includes(selectedBloc) : true))
    .sort(
    (left, right) => (left.yearStart ?? 0) - (right.yearStart ?? 0)
  );

  return (
    <section className="wiki-paper p-5 md:p-6">
      <header className="border-b border-wiki-border pb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Vista global</p>
        <h1 className="wiki-page-title mt-2">Timeline del escenario</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
          Recorrido cronológico de los hitos principales del universo ficticio desde 2026 hasta 2100.
        </p>
      </header>

      <form action="/timeline" className="mt-6 grid gap-3 rounded-sm border border-wiki-border bg-wiki-page p-4 md:grid-cols-4">
        <select
          name="era"
          defaultValue={selectedEra}
          className="rounded-sm border border-wiki-border bg-white px-3 py-2 text-sm"
        >
          <option value="">Todas las eras</option>
          {eras.map((era) => (
            <option key={era.slug} value={era.slug}>
              Era {era.number}: {era.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={selectedType}
          className="rounded-sm border border-wiki-border bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos los tipos</option>
          {articleTypes.map((type) => (
            <option key={type} value={type}>
              {startCase(type)}
            </option>
          ))}
        </select>
        <select
          name="bloc"
          defaultValue={selectedBloc}
          className="rounded-sm border border-wiki-border bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos los bloques</option>
          {blocs.map((bloc) => (
            <option key={bloc.slug} value={bloc.slug}>
              {bloc.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {timeline.length === 0 ? (
          <p className="text-wiki-muted">No hay hitos que coincidan con los filtros seleccionados.</p>
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
                <span className="wiki-badge">{article.type}</span>
                {article.eraSlug ? <span className="wiki-badge">{startCase(article.eraSlug)}</span> : null}
              </div>
              <h2 className="mt-3 font-heading text-2xl">
                <Link href={`/article/${article.slug}`} className="hover:text-wiki-blue">
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
