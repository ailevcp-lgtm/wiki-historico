import Link from "next/link";

import {
  getFeaturedArticle,
  getLatestArticles,
  getNavigationData,
  getWikiStats
} from "@/lib/repository";
import { formatYearRange, humanizeSlug } from "@/lib/utils";

export default async function HomePage() {
  const featuredArticle = await getFeaturedArticle();
  const latestArticles = await getLatestArticles();
  const stats = await getWikiStats();
  const { blocs, eras } = getNavigationData();

  return (
    <div className="space-y-6">
      <section className="wiki-paper overflow-hidden">
        <div className="border-b border-wiki-border bg-gradient-to-r from-[#f7f5ef] via-white to-[#e8eff7] px-5 py-8 md:px-8">
          <p className="mb-2 text-sm uppercase tracking-[0.24em] text-wiki-muted">Modelo histórico futurista</p>
          <h1 className="wiki-page-title max-w-3xl">Histórico 2026-2100</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
            Una wiki ficticia para seguir la evolución del mundo desde la crisis inicial hasta la
            cumbre que discute quién tiene derecho al futuro.
          </p>
        </div>

        <div className="space-y-3 px-5 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl">Cronología base</h2>
            <Link href="/timeline" className="wiki-link text-sm">
              Ver timeline completo
            </Link>
          </div>

          <div className="grid gap-2 md:grid-cols-4">
            {eras.map((era) => (
              <Link
                key={era.slug}
                href={`/era/${era.slug}`}
                className="rounded-sm border border-wiki-border px-4 py-3 text-sm transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: era.color }}
              >
                <div className="font-semibold text-white">
                  Era {era.number}: {era.name}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.12em] text-white/85">
                  {formatYearRange(era.yearStart, era.yearEnd)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="wiki-paper p-5 md:p-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="wiki-badge">Artículo destacado</span>
            <span className="text-sm text-wiki-muted">{featuredArticle.type}</span>
          </div>
          <h2 className="font-heading text-3xl leading-tight">
            <Link href={`/article/${featuredArticle.slug}`} className="hover:text-wiki-blue">
              {featuredArticle.title}
            </Link>
          </h2>
          <p className="mt-3 text-base leading-7 text-wiki-muted">{featuredArticle.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {featuredArticle.categorySlugs.map((slug) => (
              <Link key={slug} href={`/category/${slug}`} className="wiki-badge">
                {humanizeSlug(slug)}
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link href={`/article/${featuredArticle.slug}`} className="wiki-link font-semibold">
              Abrir artículo completo
            </Link>
          </div>
        </article>

        <aside className="space-y-6">
          <section className="wiki-paper p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl">Últimos publicados</h2>
              <Link href="/search" className="wiki-link text-sm">
                Explorar todo
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {latestArticles.map((article) => (
                <article key={article.slug} className="border-b border-wiki-border pb-4 last:border-b-0 last:pb-0">
                  <Link href={`/article/${article.slug}`} className="font-semibold text-wiki-blue hover:underline">
                    {article.title}
                  </Link>
                  <p className="mt-1 text-sm text-wiki-muted">
                    {article.yearStart} · {article.summary}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl">Acceso por bloques</h2>
          <span className="text-sm text-wiki-muted">Mapa político resumido</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {blocs.map((bloc) => (
            <article
              key={bloc.slug}
              className="rounded-sm border border-wiki-border p-4"
              style={{ backgroundColor: bloc.color }}
            >
              <h3 className="font-heading text-xl">{bloc.name}</h3>
              <p className="mt-2 text-sm leading-6 text-wiki-muted">{bloc.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl">Estadísticas del archivo</h2>
          <span className="text-sm text-wiki-muted">Estado actual de la wiki</span>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Artículos publicados" value={String(stats.publishedArticles)} />
          <StatCard label="Países y regiones" value={String(stats.countries)} />
          <StatCard label="Categorías" value={String(stats.categories)} />
          <StatCard label="Eras activas" value={String(stats.eras)} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-sm border border-wiki-border bg-white p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-wiki-muted">{label}</div>
      <div className="mt-2 font-heading text-3xl">{value}</div>
    </article>
  );
}
