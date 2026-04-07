import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { ReadingProgressBadge } from "@/components/reading-progress";
import { articleTypeLabelEs } from "@/lib/article-type-label";
import {
  getArticlesByCategory,
  getCategoryBySlug,
  getNavigationData,
  getPublicWikiCopy
} from "@/lib/repository";
import {
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
  buildMetadata,
  metadataBase,
  siteTitle
} from "@/lib/seo";

export async function generateStaticParams() {
  return (await getNavigationData()).categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const category = await getCategoryBySlug(resolvedParams.slug);

  if (!category) {
    return {
      metadataBase,
      ...buildMetadata({
        title: siteTitle,
        description: siteTitle,
        path: "/category",
        imagePath: "/opengraph-image",
        noIndex: true
      })
    };
  }

  const title = `${category.name} | ${siteTitle}`;

  return {
    metadataBase,
    ...buildMetadata({
      title,
      description: category.description,
      path: `/category/${category.slug}`,
      imagePath: `/category/${category.slug}/opengraph-image`,
      imageAlt: category.name,
      keywords: [category.name, "categoría", "AILE", "wiki"]
    }),
    title: { absolute: title }
  };
}

export default async function CategoryPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const category = await getCategoryBySlug(resolvedParams.slug);

  if (!category) {
    notFound();
  }

  const [articles, copy] = await Promise.all([
    getArticlesByCategory(category.slug),
    getPublicWikiCopy()
  ]);
  const title = category.name;

  return (
    <section className="wiki-paper p-5 md:p-6">
      <JsonLd
        data={[
          buildCollectionJsonLd({
            title,
            description: category.description,
            path: `/category/${category.slug}`
          }),
          buildBreadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: title, path: `/category/${category.slug}` }
          ])
        ]}
      />
      <header className="border-b border-wiki-border pb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">{copy.categoryPage.eyebrow}</p>
        <h1 className="wiki-page-title mt-2">{category.name}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">{category.description}</p>
      </header>

      <div className="mt-6 space-y-4">
        {articles.map((article) => (
          <article key={article.slug} className="rounded-sm border border-wiki-border bg-white p-4">
            <div className="flex flex-wrap gap-2">
              <span className="wiki-badge">{articleTypeLabelEs(article.type)}</span>
              {article.yearStart ? <span className="wiki-badge">{article.yearStart}</span> : null}
              {article.hitoId ? <ReadingProgressBadge slug={article.slug} /> : null}
            </div>
            <h2 className="mt-3 font-heading text-2xl">
              <Link href={`/article/${article.slug}`} className="wiki-link-track wiki-news-link">
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
