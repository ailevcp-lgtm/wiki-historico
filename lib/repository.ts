import "server-only";

import { blocs, categories, eras } from "@/lib/mock-data";
import { listPersistedArticles, listPersistedCountries } from "@/lib/content/store";
import { articles as mockArticles, countries as mockCountries } from "@/lib/mock-data";
import { normalizeForSearch, stripMarkdown, truncate } from "@/lib/utils";
import type { Article, Country } from "@/types/wiki";

export function getNavigationData() {
  return {
    eras,
    categories,
    blocs
  };
}

export function getEraBySlug(slug: string) {
  return eras.find((era) => era.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export async function getArticleIndex() {
  const publishedArticles = await getPublishedArticles();
  return Object.fromEntries(publishedArticles.map((article) => [article.slug, article.title]));
}

export async function getPublishedArticles(): Promise<Article[]> {
  const mergedArticles = mergeBySlug(mockArticles, await listPersistedArticles());

  return mergedArticles
    .filter((article) => article.status === "published")
    .sort((left, right) => (left.yearStart ?? 0) - (right.yearStart ?? 0));
}

export async function getAllArticles(): Promise<Article[]> {
  return mergeBySlug(mockArticles, await listPersistedArticles()).sort((left, right) => {
    if ((right.yearStart ?? 0) !== (left.yearStart ?? 0)) {
      return (right.yearStart ?? 0) - (left.yearStart ?? 0);
    }

    return left.title.localeCompare(right.title, "es");
  });
}

export async function getFeaturedArticle(): Promise<Article> {
  const publishedArticles = await getPublishedArticles();
  return publishedArticles.find((article) => article.featured) ?? publishedArticles[0];
}

export async function getLatestArticles(limit = 5): Promise<Article[]> {
  return [...(await getPublishedArticles())]
    .sort((left, right) => (right.yearStart ?? 0) - (left.yearStart ?? 0))
    .slice(0, limit);
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  return (await getPublishedArticles()).find((article) => article.slug === slug);
}

export async function getEditableArticleBySlug(slug: string): Promise<Article | undefined> {
  return (await getAllArticles()).find((article) => article.slug === slug);
}

export async function getArticlesByEra(slug: string): Promise<Article[]> {
  return (await getPublishedArticles()).filter((article) => article.eraSlug === slug);
}

export async function getArticlesByCategory(slug: string): Promise<Article[]> {
  return [...(await getPublishedArticles())]
    .filter((article) => article.categorySlugs.includes(slug))
    .sort((left, right) => left.title.localeCompare(right.title, "es"));
}

export async function getCountryBySlug(slug: string): Promise<Country | undefined> {
  return (await getAllCountries()).find((country) => country.slug === slug);
}

export async function getAllCountries(): Promise<Country[]> {
  return mergeBySlug(mockCountries, await listPersistedCountries()).sort((left, right) =>
    left.name.localeCompare(right.name, "es")
  );
}

export async function getEditableCountryBySlug(slug: string): Promise<Country | undefined> {
  return (await getAllCountries()).find((country) => country.slug === slug);
}

export async function searchArticles(query: string): Promise<Array<{ article: Article; excerpt: string }>> {
  const normalizedQuery = normalizeForSearch(query.trim());

  if (!normalizedQuery) {
    return [];
  }

  return (await getPublishedArticles())
    .map((article) => {
      const excerptSource = stripMarkdown(article.content);
      const haystack = normalizeForSearch(`${article.title} ${article.summary} ${excerptSource}`);

      if (!haystack.includes(normalizedQuery)) {
        return null;
      }

      const matchIndex = normalizeForSearch(excerptSource).indexOf(normalizedQuery);
      const safeIndex = Math.max(0, matchIndex - 70);
      const excerpt = truncate(excerptSource.slice(safeIndex), 180);

      return { article, excerpt };
    })
    .filter((result): result is { article: Article; excerpt: string } => Boolean(result));
}

export async function getWikiStats() {
  const [publishedArticles, allCountries] = await Promise.all([getPublishedArticles(), getAllCountries()]);

  return {
    publishedArticles: publishedArticles.length,
    countries: allCountries.length,
    categories: categories.length,
    eras: eras.length
  };
}

function mergeBySlug<T extends { slug: string }>(baseItems: T[], overrideItems: T[]): T[] {
  const merged = new Map(baseItems.map((item) => [item.slug, item]));

  for (const item of overrideItems) {
    merged.set(item.slug, item);
  }

  return [...merged.values()];
}
