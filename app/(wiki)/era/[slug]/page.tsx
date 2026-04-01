import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticlesByEra, getEraBySlug, getNavigationData, getPublicWikiCopy } from "@/lib/repository";

export async function generateStaticParams() {
  return (await getNavigationData()).eras.map((era) => ({ slug: era.slug }));
}

export default async function EraPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const era = await getEraBySlug(resolvedParams.slug);

  if (!era) {
    notFound();
  }

  const [articles, copy] = await Promise.all([getArticlesByEra(era.slug), getPublicWikiCopy()]);

  return (
    <div className="space-y-6">
      <section className="wiki-paper overflow-hidden">
        <div className="px-5 py-6 text-white md:px-8" style={{ backgroundColor: era.color }}>
          <p className="text-sm uppercase tracking-[0.2em] text-white/85">Era {era.number}</p>
          <h1 className="mt-2 font-heading text-4xl leading-tight">{era.name}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-white/90">{era.theme}</p>
        </div>
        <div className="px-5 py-5 md:px-8">
          <p className="max-w-3xl leading-8 text-wiki-muted">{era.description}</p>
        </div>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl">{copy.eraPage.sectionTitle}</h2>
          <span className="text-sm text-wiki-muted">
            {era.yearStart}-{era.yearEnd}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="rounded-sm border border-wiki-border bg-white p-4 transition-shadow hover:shadow-wiki"
            >
              <div className="flex flex-wrap gap-2">
                <span className="wiki-badge">{article.type}</span>
                {article.hitoId ? <span className="wiki-badge">{article.hitoId}</span> : null}
              </div>
              <h3 className="mt-3 font-heading text-2xl">
                <Link href={`/article/${article.slug}`} className="wiki-link-track">
                  {article.title}
                </Link>
              </h3>
              <p className="mt-2 text-wiki-muted">{article.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
