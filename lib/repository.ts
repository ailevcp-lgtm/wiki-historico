import "server-only";

import { inferBlocFromCountry, publicBlocDefinitions } from "@/lib/bloc-profiles";
import { getSeedCountries, getSeedCountryOrder } from "@/lib/country-directory";
import { normalizeCountryOrganMemberships } from "@/lib/country-organs";
import { listPersistedArticles, listPersistedCountries } from "@/lib/content/store";
import { normalizeHitoId } from "@/lib/hito-references";
import { findCanonicalCountry } from "@/lib/import/country-normalization";
import { getSiteConfig } from "@/lib/site-config/store";
import { normalizeForSearch, stripMarkdown, truncate } from "@/lib/utils";
import type { Article, Country, HitoReferenceTarget, PublicWikiCopy } from "@/types/wiki";

export async function getNavigationData() {
  const { categories, eras } = await getSiteConfig();

  return {
    eras,
    categories,
    blocs: publicBlocDefinitions.map(
      ({ longDescription: _longDescription, characteristics: _characteristics, ...bloc }) => bloc
    )
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

export async function getBlocBySlug(slug: string) {
  return (await getNavigationData()).blocs.find((bloc) => bloc.slug === slug);
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
  const published = await getPublishedArticles();
  const directMatches = published.filter((article) => article.eraSlug === slug);

  if (slug === "era-1") {
    const maxEraOneHitoOrder = directMatches.reduce((maxValue, article) => {
      const order = getHitoOrder(article.hitoId);
      return Number.isFinite(order) ? Math.max(maxValue, order) : maxValue;
    }, 0);
    const preEraMatches = published.filter((article) => {
      if (article.eraSlug === slug) {
        return false;
      }

      const hitoOrder = getHitoOrder(article.hitoId);
      return Number.isFinite(hitoOrder) && hitoOrder > 0 && hitoOrder <= maxEraOneHitoOrder;
    });
    const uniqueArticles = new Map<string, Article>();

    for (const article of [...directMatches, ...preEraMatches]) {
      uniqueArticles.set(article.slug, article);
    }

    return [...uniqueArticles.values()].sort(sortArticlesByChronology);
  }

  return directMatches.sort(sortArticlesByChronology);
}

export async function getArticlesByCategory(slug: string): Promise<Article[]> {
  return [...(await getPublishedArticles())]
    .filter((article) => article.categorySlugs.includes(slug))
    .sort((left, right) => left.title.localeCompare(right.title, "es"));
}

export async function getArticlesByBloc(slug: string): Promise<Article[]> {
  return [...(await getPublishedArticles())]
    .filter((article) => articleBelongsToBloc(article, slug))
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

export async function getCountryBySlug(slug: string): Promise<Country | undefined> {
  return (await getAllCountries()).find((country) => country.slug === slug);
}

export async function getAllCountries(): Promise<Country[]> {
  const seedCountries = await getSeedCountries();
  const persistedCountries = normalizeCountryRoster(await listPersistedCountries());
  const mergedCountries = normalizeCountryRoster(mergeBySlug(seedCountries, persistedCountries));
  const seedMap = new Map(seedCountries.map((country) => [country.slug, country] as const));

  return mergedCountries
    .map((country) => applySeedCountryFallback(country, seedMap.get(country.slug)))
    .filter((country) => (country.organMemberships?.length ?? 0) > 0)
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

export async function getCountriesByBloc(slug: string): Promise<Country[]> {
  return (await getCountryDirectory()).filter((country) => country.bloc === slug);
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
    return applyCountryDataCorrections({
      ...country,
      bloc: inferBlocFromCountry(country)
    });
  }

  const merged = {
    ...seedCountry,
    ...country,
    organMemberships: country.organMemberships ?? seedCountry.organMemberships
  };

  return applyCountryDataCorrections({
    ...merged,
    bloc: inferBlocFromCountry(merged)
  });
}

function applyCountryDataCorrections(country: Country): Country {
  switch (country.slug) {
    case "francia":
      return {
        ...country,
        bloc: country.bloc ?? "tecnologicos",
        organMemberships: normalizeCountryOrganMemberships([...(country.organMemberships ?? []), "cdh"])
      };
    case "sudafrica":
      return {
        ...country,
        organMemberships: normalizeCountryOrganMemberships([
          ...(country.organMemberships ?? []),
          "cdh"
        ])
      };
    case "brasil":
      return {
        ...country,
        organMemberships: normalizeCountryOrganMemberships([
          ...(country.organMemberships ?? []),
          "cdh"
        ])
      };
    default:
      return country;
  }
}

function normalizeCountryRoster(countries: Country[]) {
  const normalizedBySlug = new Map<string, Country>();

  for (const country of countries) {
    const normalized = applyCountryDataCorrections(canonicalizeCountryIdentity(country));
    const existing = normalizedBySlug.get(normalized.slug);

    if (!existing) {
      normalizedBySlug.set(normalized.slug, normalized);
      continue;
    }

    normalizedBySlug.set(normalized.slug, mergeDuplicateCountries(existing, normalized));
  }

  return [...normalizedBySlug.values()];
}

function canonicalizeCountryIdentity(country: Country): Country {
  const canonical = findCanonicalCountry(country.slug) ?? findCanonicalCountry(country.name);

  if (!canonical) {
    return country;
  }

  const mergedOrganMemberships = normalizeCountryOrganMemberships([
    ...(canonical.organMemberships ?? []),
    ...(country.organMemberships ?? [])
  ]);

  return {
    ...country,
    slug: canonical.slug,
    name: canonical.name,
    organMemberships:
      mergedOrganMemberships ?? country.organMemberships ?? normalizeCountryOrganMemberships(canonical.organMemberships)
  };
}

function mergeDuplicateCountries(existing: Country, incoming: Country): Country {
  const existingScore = countryPriorityScore(existing);
  const incomingScore = countryPriorityScore(incoming);
  const primary = incomingScore >= existingScore ? incoming : existing;
  const secondary = primary === incoming ? existing : incoming;

  return {
    ...secondary,
    ...primary,
    slug: primary.slug,
    name: primary.name,
    bloc: primary.bloc ?? secondary.bloc,
    summary: pickPreferredNarrative(primary.summary, secondary.summary),
    profileMarkdown: pickPreferredNarrative(primary.profileMarkdown, secondary.profileMarkdown),
    flagUrl: primary.flagUrl ?? secondary.flagUrl,
    mapUrl: primary.mapUrl ?? secondary.mapUrl,
    organMemberships: normalizeCountryOrganMemberships([
      ...(secondary.organMemberships ?? []),
      ...(primary.organMemberships ?? [])
    ]),
    scores: primary.scores.length >= secondary.scores.length ? primary.scores : secondary.scores
  };
}

function countryPriorityScore(country: Country) {
  let score = 0;

  if (hasEditorialNarrative(country.summary, "figura en la matriz base de países del escenario")) {
    score += 2;
  }

  if (hasEditorialNarrative(country.profileMarkdown, "## Ficha base")) {
    score += 2;
  }

  score += country.organMemberships?.length ?? 0;
  score += country.scores.length > 0 ? 2 : 0;
  score += country.bloc ? 1 : 0;
  score += country.flagUrl ? 1 : 0;
  score += country.mapUrl ? 1 : 0;

  return score;
}

function hasEditorialNarrative(value: string, placeholderMarker: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  return !trimmed.includes(placeholderMarker);
}

function pickPreferredNarrative(primary: string, secondary: string) {
  return primary.trim() ? primary : secondary;
}

function getHitoOrder(hitoId?: string) {
  const match = hitoId?.match(/(\d+)/);

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  return Number(match[1]);
}

function sortArticlesByChronology(left: Article, right: Article) {
  const leftHitoOrder = getHitoOrder(left.hitoId);
  const rightHitoOrder = getHitoOrder(right.hitoId);

  if (leftHitoOrder !== rightHitoOrder) {
    return leftHitoOrder - rightHitoOrder;
  }

  if ((left.yearStart ?? 0) !== (right.yearStart ?? 0)) {
    return (left.yearStart ?? 0) - (right.yearStart ?? 0);
  }

  return left.title.localeCompare(right.title, "es");
}

function articleBelongsToBloc(article: Article, blocSlug: string) {
  if (article.blocSlugs?.includes(blocSlug)) {
    return true;
  }

  if (article.slug === blocSlug) {
    return true;
  }

  if (article.relatedSlugs.includes(blocSlug)) {
    return true;
  }

  const infoboxBlocValue = article.infobox?.bloc;

  if (typeof infoboxBlocValue === "string") {
    const normalizedValue = infoboxBlocValue
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");
    return normalizedValue === blocSlug;
  }

  return false;
}
