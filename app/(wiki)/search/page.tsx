import Link from "next/link";

import { searchArticles } from "@/lib/repository";
import { humanizeSlug, normalizeQueryParam } from "@/lib/utils";

export default async function SearchPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = normalizeQueryParam(resolvedSearchParams?.q);
  const results = query ? await searchArticles(query) : [];

  return (
    <section className="wiki-paper p-5 md:p-6">
      <header className="border-b border-wiki-border pb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Búsqueda</p>
        <h1 className="wiki-page-title mt-2">Explorar la wiki</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
          Busca por título, resumen o cuerpo de artículo. En la fase actual se utiliza un índice local mock.
        </p>
      </header>

      <form action="/search" className="mt-6 flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Ejemplo: litio, cumbre, tecnópolis"
          className="w-full rounded-sm border border-wiki-border px-3 py-2 outline-none focus:border-wiki-blue"
        />
        <button
          type="submit"
          className="rounded-sm border border-wiki-border bg-wiki-page px-4 py-2 font-semibold"
        >
          Buscar
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {query && results.length === 0 ? (
          <p className="text-wiki-muted">
            No se encontraron resultados para <span className="font-semibold">&quot;{query}&quot;</span>.
          </p>
        ) : null}

        {!query ? <p className="text-wiki-muted">Escribe un término para empezar.</p> : null}

        {results.map(({ article, excerpt }) => (
          <article key={article.slug} className="rounded-sm border border-wiki-border bg-white p-4">
            <div className="flex flex-wrap gap-2">
              <span className="wiki-badge">{article.type}</span>
              {article.yearStart ? <span className="wiki-badge">{article.yearStart}</span> : null}
              {article.eraSlug ? <span className="wiki-badge">{humanizeSlug(article.eraSlug)}</span> : null}
            </div>
            <h2 className="mt-3 font-heading text-2xl">
              <Link href={`/article/${article.slug}`} className="hover:text-wiki-blue">
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
