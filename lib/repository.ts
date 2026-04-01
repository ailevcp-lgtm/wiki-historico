import "server-only";

import { getSeedCountries, getSeedCountryOrder } from "@/lib/country-directory";
import { listPersistedArticles, listPersistedCountries } from "@/lib/content/store";
import { normalizeHitoId } from "@/lib/hito-references";
import { getSiteConfig } from "@/lib/site-config/store";
import { normalizeForSearch, stripMarkdown, truncate } from "@/lib/utils";
import type { Article, Country, HitoReferenceTarget, PublicWikiCopy } from "@/types/wiki";

export async function getNavigationData() {
  const { blocs, categories, eras } = await getSiteConfig();

  return {
    eras,
    categories,
    blocs
  };
}

export async function getPublicWikiCopy(): Promise<PublicWikiCopy> {
  return (await getSiteConfig()).copy;
}

export async function getEraBySlug(slug: string) {
  return (await getNavigationData()).eras.find((era) => era.slug === slug);
}

export async function getCategoryBySlug(slug: string) {
  return (await getNavigationData()).categories.find((category) => category.slug === slug);
}

export async function getArticleIndex(options?: { includeDrafts?: boolean }) {
  const articles = options?.includeDrafts ? await getAllArticles() : await getPublishedArticles();
  return Object.fromEntries(articles.map((article) => [article.slug, article.title]));
}

export async function getArticleHitoIndex(options?: {
  includeDrafts?: boolean;
  hrefMode?: "public" | "editor";
}) {
  const articles = options?.includeDrafts ? await getAllArticles() : await getPublishedArticles();
  const hrefMode = options?.hrefMode ?? "public";

  return Object.fromEntries(
    articles
      .filter((article): article is Article & { hitoId: string } => Boolean(article.hitoId))
      .map((article) => {
        const normalizedId = normalizeHitoId(article.hitoId) ?? article.hitoId;
        const href =
          hrefMode === "editor" || article.status !== "published"
            ? `/admin/articles/${article.slug}`
            : `/article/${article.slug}`;

        return [
          normalizedId,
          {
            slug: article.slug,
            title: article.title,
            href
          } satisfies HitoReferenceTarget
        ];
      })
  );
}

export async function getPublishedArticles(): Promise<Article[]> {
  return (await listPersistedArticles())
    .filter((article) => article.status === "published")
    .sort((left, right) => (left.yearStart ?? 0) - (right.yearStart ?? 0));
}

export async function getAllArticles(): Promise<Article[]> {
  return (await listPersistedArticles()).sort((left, right) => {
    if ((right.yearStart ?? 0) !== (left.yearStart ?? 0)) {
      return (right.yearStart ?? 0) - (left.yearStart ?? 0);
    }

    return left.title.localeCompare(right.title, "es");
  });
}

export async function getFeaturedArticle(): Promise<Article | undefined> {
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
  return (await getPublishedArticles())
    .filter((article) => article.eraSlug === slug)
    .sort((left, right) => {
      const leftHitoOrder = getHitoOrder(left.hitoId);
      const rightHitoOrder = getHitoOrder(right.hitoId);

      if (leftHitoOrder !== rightHitoOrder) {
        return leftHitoOrder - rightHitoOrder;
      }

      if ((left.yearStart ?? 0) !== (right.yearStart ?? 0)) {
        return (left.yearStart ?? 0) - (right.yearStart ?? 0);
      }

      return left.title.localeCompare(right.title, "es");
    });
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
  const seedCountries = await getSeedCountries();
  const mergedCountries = mergeBySlug(seedCountries, await listPersistedCountries());
  const seedMap = new Map(seedCountries.map((country) => [country.slug, country] as const));

  return mergedCountries
    .map((country) => applySeedCountryFallback(country, seedMap.get(country.slug)))
    .sort((left, right) =>
    left.name.localeCompare(right.name, "es")
  );
}

export async function getEditableCountryBySlug(slug: string): Promise<Country | undefined> {
  return (await getAllCountries()).find((country) => country.slug === slug);
}

export async function getCountryDirectory(): Promise<Country[]> {
  const [countries, orderMap] = await Promise.all([getAllCountries(), getSeedCountryOrder()]);

  return [...countries].sort((left, right) => {
    const leftOrder = orderMap.get(left.slug);
    const rightOrder = orderMap.get(right.slug);

    if (leftOrder !== undefined || rightOrder !== undefined) {
      if (leftOrder === undefined) {
        return 1;
      }

      if (rightOrder === undefined) {
        return -1;
      }

      return leftOrder - rightOrder;
    }

    return left.name.localeCompare(right.name, "es");
  });
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
  const [publishedArticles, allCountries, navigation] = await Promise.all([
    getPublishedArticles(),
    getAllCountries(),
    getNavigationData()
  ]);

  return {
    publishedArticles: publishedArticles.length,
    countries: allCountries.length,
    categories: navigation.categories.length,
    eras: navigation.eras.length
  };
}

function mergeBySlug<T extends { slug: string }>(baseItems: T[], overrideItems: T[]): T[] {
  const merged = new Map(baseItems.map((item) => [item.slug, item]));

  for (const item of overrideItems) {
    merged.set(item.slug, item);
  }

  return [...merged.values()];
}

function applySeedCountryFallback(country: Country, seedCountry?: Country): Country {
  if (!seedCountry) {
    return country;
  }

  return {
    ...seedCountry,
    ...country,
    organMemberships: country.organMemberships ?? seedCountry.organMemberships
  };
}

function getHitoOrder(hitoId?: string) {
  const match = hitoId?.match(/(\d+)/);

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  return Number(match[1]);
}
