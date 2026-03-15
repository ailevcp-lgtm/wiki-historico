import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticlesByCategory, getCategoryBySlug, getNavigationData } from "@/lib/repository";

export function generateStaticParams() {
  return getNavigationData().categories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const category = getCategoryBySlug(resolvedParams.slug);

  if (!category) {
    notFound();
  }

  const articles = await getArticlesByCategory(category.slug);

  return (
    <section className="wiki-paper p-5 md:p-6">
      <header className="border-b border-wiki-border pb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Categoría</p>
        <h1 className="wiki-page-title mt-2">{category.name}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">{category.description}</p>
      </header>

      <div className="mt-6 space-y-4">
        {articles.map((article) => (
          <article key={article.slug} className="rounded-sm border border-wiki-border bg-white p-4">
            <div className="flex flex-wrap gap-2">
              <span className="wiki-badge">{article.type}</span>
              {article.yearStart ? <span className="wiki-badge">{article.yearStart}</span> : null}
            </div>
            <h2 className="mt-3 font-heading text-2xl">
              <Link href={`/article/${article.slug}`} className="hover:text-wiki-blue">
                {article.title}
              </Link>
            </h2>
            <p className="mt-2 text-wiki-muted">{article.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
