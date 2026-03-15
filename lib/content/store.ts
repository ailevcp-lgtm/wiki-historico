import "server-only";

import { promises as fs } from "fs";
import path from "path";

import { unstable_noStore as noStore } from "next/cache";

import { articles as mockArticles, countries as mockCountries } from "@/lib/mock-data";
import { getStagingMode, getSourceDocumentById, updateSourceDocumentStatus } from "@/lib/staging/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CountryDraftCandidate, HitoDraftCandidate } from "@/types/import";
import type { PromotionResult } from "@/types/staging";
import type { Article, Country, CountryScore } from "@/types/wiki";

const localFilePath = path.join(process.cwd(), "storage", "wiki-content.local.json");

interface LocalWikiStore {
  articles: Article[];
  countries: Country[];
}

type ArticleRow = {
  slug: string;
  title: string;
  type: Article["type"];
  content: string;
  summary: string | null;
  infobox: Article["infobox"] | null;
  category_slugs: string[] | null;
  related_slugs: string[] | null;
  era_slug: string | null;
  hito_id: string | null;
  year_start: number | null;
  year_end: number | null;
  image_url: string | null;
  featured: boolean;
  status: Article["status"];
  author: string | null;
};

type CountryRow = {
  id: string;
  slug: string;
  name: string;
  bloc: string | null;
  summary: string | null;
  profile_markdown: string | null;
  flag_url: string | null;
};

type CountryScoreRow = {
  country_id: string;
  hito_id: string | null;
  era_slug: string | null;
  climate_exposure: number | null;
  state_capacity: number | null;
  power_resources: number | null;
  tech_dependency: number | null;
  demographic_pressure: number | null;
  social_cohesion: number | null;
  economic_vulnerability: number | null;
  climate_trend: CountryScore["climateTrend"] | null;
  state_trend: CountryScore["stateTrend"] | null;
  power_trend: CountryScore["powerTrend"] | null;
  tech_trend: CountryScore["techTrend"] | null;
  demographic_trend: CountryScore["demographicTrend"] | null;
  social_trend: CountryScore["socialTrend"] | null;
  economic_trend: CountryScore["economicTrend"] | null;
  notes: string | null;
  created_at: string;
};

export async function listPersistedArticles(): Promise<Article[]> {
  noStore();

  if (getStagingMode() === "supabase") {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("articles").select("*");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapArticleRow(row as ArticleRow));
  }

  const store = await readLocalStore();
  return store.articles;
}

export async function listPersistedCountries(): Promise<Country[]> {
  noStore();

  if (getStagingMode() === "supabase") {
    const supabase = createSupabaseAdminClient();
    const { data: countryRows, error: countriesError } = await supabase.from("countries").select("*");

    if (countriesError) {
      throw new Error(countriesError.message);
    }

    const { data: scoreRows, error: scoresError } = await supabase
      .from("country_scores")
      .select("*")
      .order("created_at", { ascending: true });

    if (scoresError) {
      throw new Error(scoresError.message);
    }

    const scoresByCountryId = new Map<string, CountryScore[]>();
    for (const row of (scoreRows ?? []) as CountryScoreRow[]) {
      const entry = scoresByCountryId.get(row.country_id) ?? [];
      entry.push(mapCountryScoreRow(row));
      scoresByCountryId.set(row.country_id, entry);
    }

    return ((countryRows ?? []) as CountryRow[]).map((row) => ({
      slug: row.slug,
      name: row.name,
      bloc: row.bloc ?? undefined,
      summary: row.summary ?? "",
      profileMarkdown: row.profile_markdown ?? "",
      flagUrl: row.flag_url ?? undefined,
      scores: scoresByCountryId.get(row.id) ?? []
    }));
  }

  const store = await readLocalStore();
  return store.countries;
}

export async function promoteSourceDocument(id: string): Promise<PromotionResult> {
  const document = await getSourceDocumentById(id);

  if (!document) {
    throw new Error("Documento staged no encontrado.");
  }

  if (document.detectedKind === "unknown") {
    throw new Error("No se puede promover una ficha sin tipo reconocido.");
  }

  if (document.detectedKind === "hito" && document.normalizedPayload.kind === "hito") {
    const article = mapDraftToArticle(document.normalizedPayload.draft);
    await saveArticle(article);
    await updateSourceDocumentStatus(id, "imported");

    return {
      documentId: id,
      detectedKind: "hito",
      importStatus: "imported",
      targetSlug: article.slug,
      targetPath: `/admin/articles?slug=${article.slug}`,
      destinationMode: getStagingMode()
    };
  }

  if (document.detectedKind === "country" && document.normalizedPayload.kind === "country") {
    const country = mapDraftToCountry(document.normalizedPayload.draft);
    await saveCountry(country, { mergeScores: true });
    await updateSourceDocumentStatus(id, "imported");

    return {
      documentId: id,
      detectedKind: "country",
      importStatus: "imported",
      targetSlug: country.slug,
      targetPath: `/admin/countries/${country.slug}`,
      destinationMode: getStagingMode()
    };
  }

  throw new Error("El payload normalizado no coincide con el tipo detectado para la ficha.");
}

export async function updateArticleStatus(
  slug: string,
  status: Article["status"]
): Promise<Article | undefined> {
  const existing = await findStoredArticleBySlug(slug);

  if (!existing) {
    return undefined;
  }

  const updated: Article = {
    ...existing,
    status
  };

  await persistArticle(updated);
  return updated;
}

export async function saveArticle(article: Article): Promise<Article> {
  await persistArticle(article);
  return article;
}

export async function saveCountry(
  country: Country,
  options?: { mergeScores?: boolean }
): Promise<Country> {
  const nextCountry = options?.mergeScores
    ? mergeCountryWithStored(country, await findStoredCountryBySlug(country.slug))
    : country;

  await persistCountry(nextCountry);
  return nextCountry;
}

async function persistArticle(article: Article): Promise<void> {
  if (getStagingMode() === "supabase") {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("articles").upsert(
      {
        slug: article.slug,
        title: article.title,
        type: article.type,
        content: article.content,
        summary: article.summary,
        infobox: article.infobox ?? null,
        category_slugs: article.categorySlugs,
        related_slugs: article.relatedSlugs,
        era_slug: article.eraSlug ?? null,
        hito_id: article.hitoId ?? null,
        year_start: article.yearStart ?? null,
        year_end: article.yearEnd ?? null,
        image_url: article.imageUrl ?? null,
        featured: article.featured ?? false,
        status: article.status,
        author: article.author ?? null
      },
      { onConflict: "slug" }
    );

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const store = await readLocalStore();
  store.articles = upsertBySlug(store.articles, article);
  await writeLocalStore(store);
}

async function persistCountry(country: Country): Promise<void> {
  if (getStagingMode() === "supabase") {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("countries")
      .upsert(
        {
          slug: country.slug,
          name: country.name,
          bloc: country.bloc ?? null,
          summary: country.summary,
          profile_markdown: country.profileMarkdown,
          flag_url: country.flagUrl ?? null
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "No se pudo guardar el país promovido.");
    }

    const countryId = (data as { id: string }).id;
    const { error: deleteError } = await supabase
      .from("country_scores")
      .delete()
      .eq("country_id", countryId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (country.scores.length > 0) {
      const { error: insertError } = await supabase
        .from("country_scores")
        .insert(country.scores.map((score) => mapCountryScoreForInsert(score, countryId)));

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    return;
  }

  const store = await readLocalStore();
  store.countries = upsertBySlug(store.countries, country);
  await writeLocalStore(store);
}

async function findStoredArticleBySlug(slug: string): Promise<Article | undefined> {
  const persisted = await listPersistedArticles();
  return persisted.find((article) => article.slug === slug) ?? mockArticles.find((article) => article.slug === slug);
}

async function findStoredCountryBySlug(slug: string): Promise<Country | undefined> {
  const persisted = await listPersistedCountries();
  return persisted.find((country) => country.slug === slug) ?? mockCountries.find((country) => country.slug === slug);
}

async function readLocalStore(): Promise<LocalWikiStore> {
  await ensureLocalStore();
  const content = await fs.readFile(localFilePath, "utf8");
  return JSON.parse(content) as LocalWikiStore;
}

async function writeLocalStore(store: LocalWikiStore): Promise<void> {
  await ensureLocalStore();
  await fs.writeFile(localFilePath, JSON.stringify(store, null, 2));
}

async function ensureLocalStore(): Promise<void> {
  await fs.mkdir(path.dirname(localFilePath), { recursive: true });

  try {
    await fs.access(localFilePath);
  } catch {
    const initialStore: LocalWikiStore = {
      articles: [],
      countries: []
    };
    await fs.writeFile(localFilePath, JSON.stringify(initialStore, null, 2));
  }
}

function upsertBySlug<T extends { slug: string }>(items: T[], nextItem: T): T[] {
  const remaining = items.filter((item) => item.slug !== nextItem.slug);
  return [nextItem, ...remaining];
}

function mapArticleRow(row: ArticleRow): Article {
  return {
    slug: row.slug,
    title: row.title,
    type: row.type,
    content: row.content,
    summary: row.summary ?? "",
    infobox: row.infobox ?? undefined,
    categorySlugs: row.category_slugs ?? [],
    relatedSlugs: row.related_slugs ?? [],
    eraSlug: row.era_slug ?? undefined,
    hitoId: row.hito_id ?? undefined,
    yearStart: row.year_start ?? undefined,
    yearEnd: row.year_end ?? undefined,
    imageUrl: row.image_url ?? undefined,
    featured: row.featured,
    status: row.status,
    author: row.author ?? undefined
  };
}

function mapCountryScoreRow(row: CountryScoreRow): CountryScore {
  return {
    eraSlug: row.era_slug ?? undefined,
    hitoId: row.hito_id ?? undefined,
    climateExposure: row.climate_exposure ?? undefined,
    stateCapacity: row.state_capacity ?? undefined,
    powerResources: row.power_resources ?? undefined,
    techDependency: row.tech_dependency ?? undefined,
    demographicPressure: row.demographic_pressure ?? undefined,
    socialCohesion: row.social_cohesion ?? undefined,
    economicVulnerability: row.economic_vulnerability ?? undefined,
    climateTrend: row.climate_trend ?? undefined,
    stateTrend: row.state_trend ?? undefined,
    powerTrend: row.power_trend ?? undefined,
    techTrend: row.tech_trend ?? undefined,
    demographicTrend: row.demographic_trend ?? undefined,
    socialTrend: row.social_trend ?? undefined,
    economicTrend: row.economic_trend ?? undefined,
    notes: row.notes ?? undefined
  };
}

function mapDraftToArticle(draft: HitoDraftCandidate): Article {
  return {
    slug: draft.slug,
    title: draft.title,
    type: draft.type,
    content: draft.markdown,
    summary: draft.summary,
    infobox: draft.infobox,
    categorySlugs: draft.categorySlugs,
    relatedSlugs: [],
    eraSlug: draft.eraSlug,
    hitoId: draft.hitoId,
    yearStart: draft.yearStart,
    yearEnd: draft.yearEnd,
    status: "review",
    author: "Importador CEA"
  };
}

function mapDraftToCountry(draft: CountryDraftCandidate): Country {
  return {
    slug: draft.slug,
    name: draft.name,
    bloc: draft.bloc,
    summary: draft.summary,
    profileMarkdown: draft.profileMarkdown,
    scores: [mapDraftScores(draft)]
  };
}

function mapDraftScores(draft: CountryDraftCandidate): CountryScore {
  const scoreMap = new Map(
    draft.scores.map((score) => [normalizeVariableLabel(score.variable), score])
  );

  const notes = draft.scores
    .map((score) => (score.notes ? `${score.variable}: ${score.notes}` : ""))
    .filter(Boolean)
    .join("\n");

  return {
    eraSlug: draft.eraSlug,
    hitoId: draft.hitoReference,
    climateExposure: scoreMap.get("climate_exposure")?.score,
    stateCapacity: scoreMap.get("state_capacity")?.score,
    powerResources: scoreMap.get("power_resources")?.score,
    techDependency: scoreMap.get("tech_dependency")?.score,
    demographicPressure: scoreMap.get("demographic_pressure")?.score,
    socialCohesion: scoreMap.get("social_cohesion")?.score,
    economicVulnerability: scoreMap.get("economic_vulnerability")?.score,
    climateTrend: scoreMap.get("climate_exposure")?.trend,
    stateTrend: scoreMap.get("state_capacity")?.trend,
    powerTrend: scoreMap.get("power_resources")?.trend,
    techTrend: scoreMap.get("tech_dependency")?.trend,
    demographicTrend: scoreMap.get("demographic_pressure")?.trend,
    socialTrend: scoreMap.get("social_cohesion")?.trend,
    economicTrend: scoreMap.get("economic_vulnerability")?.trend,
    notes: notes || undefined
  };
}

function normalizeVariableLabel(value: string): string {
  if (value.includes("Exposición climática")) {
    return "climate_exposure";
  }

  if (value.includes("Capacidad estatal")) {
    return "state_capacity";
  }

  if (value.includes("Recursos de poder")) {
    return "power_resources";
  }

  if (value.includes("Dependencia tech externa")) {
    return "tech_dependency";
  }

  if (value.includes("Presión demográfica")) {
    return "demographic_pressure";
  }

  if (value.includes("Cohesión social")) {
    return "social_cohesion";
  }

  return "economic_vulnerability";
}

function countryScoreKey(score: CountryScore): string {
  return `${score.eraSlug ?? "sin-era"}::${score.hitoId ?? "sin-hito"}`;
}

function mergeCountryWithStored(nextCountry: Country, existing?: Country): Country {
  if (!existing) {
    return nextCountry;
  }

  const mergedScores = new Map(
    existing.scores.map((score) => [countryScoreKey(score), score] as const)
  );

  for (const score of nextCountry.scores) {
    mergedScores.set(countryScoreKey(score), score);
  }

  return {
    ...existing,
    ...nextCountry,
    scores: [...mergedScores.values()]
  };
}

function mapCountryScoreForInsert(score: CountryScore, countryId: string) {
  return {
    country_id: countryId,
    hito_id: score.hitoId ?? null,
    era_slug: score.eraSlug ?? null,
    climate_exposure: score.climateExposure ?? null,
    state_capacity: score.stateCapacity ?? null,
    power_resources: score.powerResources ?? null,
    tech_dependency: score.techDependency ?? null,
    demographic_pressure: score.demographicPressure ?? null,
    social_cohesion: score.socialCohesion ?? null,
    economic_vulnerability: score.economicVulnerability ?? null,
    climate_trend: score.climateTrend ?? null,
    state_trend: score.stateTrend ?? null,
    power_trend: score.powerTrend ?? null,
    tech_trend: score.techTrend ?? null,
    demographic_trend: score.demographicTrend ?? null,
    social_trend: score.socialTrend ?? null,
    economic_trend: score.economicTrend ?? null,
    notes: score.notes ?? null
  };
}
