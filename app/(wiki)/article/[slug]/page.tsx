import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleMarkdown } from "@/components/article-markdown";
import { Infobox } from "@/components/infobox";
import { TableOfContents } from "@/components/table-of-contents";
import { WikiLink } from "@/components/wiki-link";
import { extractHeadings, normalizeImportedMarkdown, sanitizeArticleSummary } from "@/lib/markdown";
import {
  getArticleBySlug,
  getArticleHitoIndex,
  getArticleIndex,
  getEraBySlug,
  getPublicWikiCopy,
  getPublishedArticles
} from "@/lib/repository";
import { formatYearRange, humanizeSlug } from "@/lib/utils";

export async function generateStaticParams() {
  return (await getPublishedArticles()).map((article) => ({ slug: article.slug }));
}

export default async function ArticlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const article = await getArticleBySlug(resolvedParams.slug);

  if (!article) {
    notFound();
  }

  const normalizedContent = normalizeImportedMarkdown(article.content);
  const headings = extractHeadings(normalizedContent);
  const displaySummary = sanitizeArticleSummary(article.summary, normalizedContent);
  const [articleTitles, hitoArticles, era, copy] = await Promise.all([
    getArticleIndex(),
    getArticleHitoIndex(),
    article.eraSlug ? getEraBySlug(article.eraSlug) : Promise.resolve(undefined),
    getPublicWikiCopy()
  ]);

  return (
    <article className="wiki-paper p-5 md:p-8">
      <header className="border-b border-wiki-border pb-5">
        <div className="flex flex-wrap gap-2">
          <span className="wiki-badge">{article.type}</span>
          {era ? (
            <Link href={`/era/${era.slug}`} className="wiki-badge">
              Era {era.number}
            </Link>
          ) : null}
          <span className="wiki-badge">{formatYearRange(article.yearStart, article.yearEnd)}</span>
          {article.hitoId ? <span className="wiki-badge">{article.hitoId}</span> : null}
        </div>

        <h1 className="wiki-page-title mt-4">{article.title}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">{displaySummary}</p>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 xl:order-1">
          <ArticleMarkdown articleTitles={articleTitles} hitoArticles={hitoArticles} markdown={normalizedContent} />

          <section className="mt-10 border-t border-wiki-border pt-5">
            <h2 className="font-heading text-2xl">{copy.articlePage.categoriesSectionTitle}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {article.categorySlugs.map((slug) => (
                <Link key={slug} href={`/category/${slug}`} className="wiki-badge">
                  {humanizeSlug(slug)}
                </Link>
              ))}
            </div>
          </section>

          {article.relatedSlugs.length > 0 ? (
            <section className="mt-8 border-t border-wiki-border pt-5">
              <h2 className="font-heading text-2xl">{copy.articlePage.relatedSectionTitle}</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {article.relatedSlugs.map((slug) => (
                  <WikiLink
                    key={slug}
                    slug={slug}
                    label={articleTitles[slug] ?? humanizeSlug(slug)}
                    exists={Boolean(articleTitles[slug])}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="order-1 space-y-4 xl:order-2">
          <TableOfContents headings={headings} title={copy.articlePage.tableOfContentsTitle} />
          <Infobox
            articleTitles={articleTitles}
            data={article.infobox}
            imageUrl={article.imageUrl}
            title={article.title}
          />
        </div>
      </div>
    </article>
  );
}
