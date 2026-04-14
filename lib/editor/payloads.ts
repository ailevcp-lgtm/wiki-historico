import { normalizeCountryOrganMemberships } from "@/lib/country-organs";
import { defaultPublicWikiCopy } from "@/lib/site-config/defaults";
import type {
  Article,
  ArticleStatus,
  ArticleType,
  Bloc,
  Category,
  Country,
  CountryScore,
  PublicWikiCopy,
  TimelineEra,
  WikiSiteConfig
} from "@/types/wiki";

const articleTypes: ArticleType[] = [
  "event",
  "organization",
  "treaty",
  "technology",
  "geography",
  "society",
  "summit",
  "bloc",
  "conflict"
];

const articleStatuses: ArticleStatus[] = ["draft", "review", "published"];
const trendDirections = ["up", "down", "stable"] as const;

export function parseArticlePayload(input: unknown):
  | { success: true; value: Article }
  | { success: false; error: string } {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Payload de artículo inválido." };
  }

  const payload = input as Record<string, unknown>;
  const slug = normalizeRequiredString(payload.slug);
  const title = normalizeRequiredString(payload.title);
  const content = normalizeRequiredString(payload.content);
  const summary = normalizeString(payload.summary) ?? "";
  const type = normalizeArticleType(payload.type);
  const status = normalizeArticleStatus(payload.status);
  const yearStart = normalizeOptionalNumber(payload.yearStart);
  const yearEnd = normalizeOptionalNumber(payload.yearEnd);

  if (!slug) {
    return { success: false, error: "El slug del artículo es obligatorio." };
  }

  if (!title) {
    return { success: false, error: "El título del artículo es obligatorio." };
  }

  if (!content) {
    return { success: false, error: "El contenido Markdown del artículo es obligatorio." };
  }

  if (!type) {
    return { success: false, error: "El tipo de artículo no es válido." };
  }

  if (!status) {
    return { success: false, error: "El estado del artículo no es válido." };
  }

  if (payload.yearStart !== undefined && payload.yearStart !== "" && yearStart === undefined) {
    return { success: false, error: "El año inicial debe ser un número válido." };
  }

  if (payload.yearEnd !== undefined && payload.yearEnd !== "" && yearEnd === undefined) {
    return { success: false, error: "El año final debe ser un número válido." };
  }

  const infobox = normalizeInfobox(payload.infobox);

  if (payload.infobox !== undefined && infobox === undefined && payload.infobox !== null) {
    return { success: false, error: "El infobox debe ser un objeto JSON o null." };
  }

  return {
    success: true,
    value: {
      slug,
      title,
      type,
      content,
      summary,
      infobox,
      categorySlugs: normalizeStringArray(payload.categorySlugs),
      relatedSlugs: normalizeStringArray(payload.relatedSlugs),
      blocSlugs: normalizeStringArray(payload.blocSlugs),
      eraSlug: normalizeString(payload.eraSlug) ?? undefined,
      hitoId: normalizeString(payload.hitoId) ?? undefined,
      yearStart,
      yearEnd,
      imageUrl: normalizeString(payload.imageUrl) ?? undefined,
      status,
      author: normalizeString(payload.author) ?? undefined,
      featured: Boolean(payload.featured)
    }
  };
}

export function parseCountryPayload(input: unknown):
  | { success: true; value: Country }
  | { success: false; error: string } {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Payload de país inválido." };
  }

  const payload = input as Record<string, unknown>;
  const slug = normalizeRequiredString(payload.slug);
  const name = normalizeRequiredString(payload.name);

  if (!slug) {
    return { success: false, error: "El slug del país es obligatorio." };
  }

  if (!name) {
    return { success: false, error: "El nombre del país es obligatorio." };
  }

  const scores = parseCountryScores(payload.scores);

  if (!scores.success) {
    return scores;
  }

  return {
    success: true,
    value: {
      slug,
      name,
      bloc: normalizeString(payload.bloc) ?? undefined,
      summary: normalizeString(payload.summary) ?? "",
      profileMarkdown: normalizeString(payload.profileMarkdown) ?? "",
      flagUrl: normalizeString(payload.flagUrl) ?? undefined,
      representativeUrl: normalizeString(payload.representativeUrl) ?? undefined,
      mapUrl: normalizeString(payload.mapUrl) ?? undefined,
      organMemberships: normalizeCountryOrganMemberships(payload.organMemberships as Country["organMemberships"]) ?? [],
      scores: scores.value
    }
  };
}

export function parseSiteConfigPayload(input: unknown):
  | { success: true; value: WikiSiteConfig }
  | { success: false; error: string } {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Payload de configuración inválido." };
  }

  const payload = input as Record<string, unknown>;
  const eras = parseTimelineEras(payload.eras);

  if (!eras.success) {
    return eras;
  }

  const categories = parseCategories(payload.categories);

  if (!categories.success) {
    return categories;
  }

  const blocs = parseBlocs(payload.blocs);

  if (!blocs.success) {
    return blocs;
  }

  const copy = parsePublicWikiCopy(payload.copy);

  if (!copy.success) {
    return copy;
  }

  return {
    success: true,
    value: {
      eras: eras.value,
      categories: categories.value,
      blocs: blocs.value,
      copy: copy.value
    }
  };
}

function parseCountryScores(input: unknown):
  | { success: true; value: CountryScore[] }
  | { success: false; error: string } {
  if (input === undefined || input === null) {
    return { success: true, value: [] };
  }

  if (!Array.isArray(input)) {
    return { success: false, error: "Los puntajes del país deben enviarse como array." };
  }

  const scores: CountryScore[] = [];

  for (const entry of input) {
    if (!entry || typeof entry !== "object") {
      return { success: false, error: "Cada snapshot de puntajes debe ser un objeto." };
    }

    const snapshot = entry as Record<string, unknown>;
    const validatedScores = [
      validateScoreField(snapshot.climateExposure, "Exposición climática"),
      validateScoreField(snapshot.stateCapacity, "Capacidad estatal"),
      validateScoreField(snapshot.powerResources, "Recursos de poder"),
      validateScoreField(snapshot.techDependency, "Dependencia tecnológica"),
      validateScoreField(snapshot.demographicPressure, "Presión demográfica"),
      validateScoreField(snapshot.socialCohesion, "Cohesión social"),
      validateScoreField(snapshot.economicVulnerability, "Vulnerabilidad económica")
    ];

    const invalidScore = validatedScores.find((item) => item.error);

    if (invalidScore?.error) {
      return { success: false, error: invalidScore.error };
    }

    const score: CountryScore = {
      eraSlug: normalizeString(snapshot.eraSlug) ?? undefined,
      hitoId: normalizeString(snapshot.hitoId) ?? undefined,
      climateExposure: validatedScores[0].value,
      stateCapacity: validatedScores[1].value,
      powerResources: validatedScores[2].value,
      techDependency: validatedScores[3].value,
      demographicPressure: validatedScores[4].value,
      socialCohesion: validatedScores[5].value,
      economicVulnerability: validatedScores[6].value,
      climateTrend: normalizeTrend(snapshot.climateTrend),
      stateTrend: normalizeTrend(snapshot.stateTrend),
      powerTrend: normalizeTrend(snapshot.powerTrend),
      techTrend: normalizeTrend(snapshot.techTrend),
      demographicTrend: normalizeTrend(snapshot.demographicTrend),
      socialTrend: normalizeTrend(snapshot.socialTrend),
      economicTrend: normalizeTrend(snapshot.economicTrend),
      notes: normalizeString(snapshot.notes) ?? undefined
    };

    if (hasSnapshotContent(score)) {
      scores.push(score);
    }
  }

  return { success: true, value: scores };
}

function hasSnapshotContent(score: CountryScore) {
  return Boolean(
    score.eraSlug ||
      score.hitoId ||
      score.climateExposure ||
      score.stateCapacity ||
      score.powerResources ||
      score.techDependency ||
      score.demographicPressure ||
      score.socialCohesion ||
      score.economicVulnerability ||
      score.notes
  );
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((entry) => normalizeString(entry)).filter(Boolean) as string[])];
}

function normalizeArticleType(value: unknown) {
  return articleTypes.find((item) => item === value);
}

function normalizeArticleStatus(value: unknown) {
  return articleStatuses.find((item) => item === value);
}

function normalizeInfobox(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Article["infobox"];
}

function normalizeTrend(value: unknown) {
  return trendDirections.find((item) => item === value);
}

function parseTimelineEras(input: unknown):
  | { success: true; value: TimelineEra[] }
  | { success: false; error: string } {
  if (!Array.isArray(input) || input.length === 0) {
    return { success: false, error: "Debes enviar al menos una era." };
  }

  const eras: TimelineEra[] = [];
  const slugs = new Set<string>();
  const numbers = new Set<number>();

  for (const [index, item] of input.entries()) {
    if (!item || typeof item !== "object") {
      return { success: false, error: `La era #${index + 1} es inválida.` };
    }

    const payload = item as Record<string, unknown>;
    const slug = normalizeRequiredString(payload.slug);
    const name = normalizeRequiredString(payload.name);
    const color = normalizeRequiredString(payload.color);
    const number = normalizeOptionalNumber(payload.number);
    const yearStart = normalizeOptionalNumber(payload.yearStart);
    const yearEnd = normalizeOptionalNumber(payload.yearEnd);

    if (!slug || !name || !color || number === undefined || yearStart === undefined || yearEnd === undefined) {
      return {
        success: false,
        error: `La era #${index + 1} debe incluir slug, número, nombre, años y color.`
      };
    }

    if (slugs.has(slug)) {
      return { success: false, error: `La era con slug ${slug} está duplicada.` };
    }

    if (numbers.has(number)) {
      return { success: false, error: `El número de era ${number} está duplicado.` };
    }

    if (yearEnd < yearStart) {
      return {
        success: false,
        error: `La era ${name} no puede tener un año final menor al inicial.`
      };
    }

    slugs.add(slug);
    numbers.add(number);
    eras.push({
      slug,
      number,
      name,
      yearStart,
      yearEnd,
      theme: normalizeOptionalString(payload.theme) ?? "",
      description: normalizeOptionalString(payload.description) ?? "",
      color
    });
  }

  return { success: true, value: eras };
}

function parseCategories(input: unknown):
  | { success: true; value: Category[] }
  | { success: false; error: string } {
  if (!Array.isArray(input) || input.length === 0) {
    return { success: false, error: "Debes enviar al menos una categoría." };
  }

  const categories: Category[] = [];
  const slugs = new Set<string>();

  for (const [index, item] of input.entries()) {
    if (!item || typeof item !== "object") {
      return { success: false, error: `La categoría #${index + 1} es inválida.` };
    }

    const payload = item as Record<string, unknown>;
    const slug = normalizeRequiredString(payload.slug);
    const name = normalizeRequiredString(payload.name);

    if (!slug || !name) {
      return { success: false, error: `La categoría #${index + 1} debe incluir slug y nombre.` };
    }

    if (slugs.has(slug)) {
      return { success: false, error: `La categoría con slug ${slug} está duplicada.` };
    }

    slugs.add(slug);
    categories.push({
      slug,
      name,
      description: normalizeOptionalString(payload.description) ?? "",
      icon: normalizeOptionalString(payload.icon) ?? undefined
    });
  }

  return { success: true, value: categories };
}

function parseBlocs(input: unknown):
  | { success: true; value: Bloc[] }
  | { success: false; error: string } {
  if (!Array.isArray(input) || input.length === 0) {
    return { success: false, error: "Debes enviar al menos un bloque." };
  }

  const blocs: Bloc[] = [];
  const slugs = new Set<string>();

  for (const [index, item] of input.entries()) {
    if (!item || typeof item !== "object") {
      return { success: false, error: `El bloque #${index + 1} es inválido.` };
    }

    const payload = item as Record<string, unknown>;
    const slug = normalizeRequiredString(payload.slug);
    const name = normalizeRequiredString(payload.name);
    const color = normalizeRequiredString(payload.color);

    if (!slug || !name || !color) {
      return { success: false, error: `El bloque #${index + 1} debe incluir slug, nombre y color.` };
    }

    if (slugs.has(slug)) {
      return { success: false, error: `El bloque con slug ${slug} está duplicado.` };
    }

    slugs.add(slug);
    blocs.push({
      slug,
      name,
      summary: normalizeOptionalString(payload.summary) ?? "",
      color
    });
  }

  return { success: true, value: blocs };
}

function parsePublicWikiCopy(input: unknown):
  | { success: true; value: PublicWikiCopy }
  | { success: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { success: false, error: "La configuración pública debe incluir un bloque copy válido." };
  }

  const payload = input as Record<string, unknown>;
  const shell = parseStringSection(
    payload.shell,
    Object.keys(defaultPublicWikiCopy.shell),
    "shell"
  );

  if (!shell.success) {
    return shell;
  }

  const home = parseStringSection(payload.home, Object.keys(defaultPublicWikiCopy.home), "home");

  if (!home.success) {
    return home;
  }

  const timeline = parseStringSection(
    payload.timeline,
    Object.keys(defaultPublicWikiCopy.timeline),
    "timeline"
  );

  if (!timeline.success) {
    return timeline;
  }

  const search = parseStringSection(payload.search, Object.keys(defaultPublicWikiCopy.search), "search");

  if (!search.success) {
    return search;
  }

  const countries = parseStringSection(
    payload.countries,
    Object.keys(defaultPublicWikiCopy.countries),
    "countries"
  );

  if (!countries.success) {
    return countries;
  }

  const countryPage = parseStringSection(
    payload.countryPage,
    Object.keys(defaultPublicWikiCopy.countryPage),
    "countryPage"
  );

  if (!countryPage.success) {
    return countryPage;
  }

  const countryScorecard = parseStringSection(
    payload.countryScorecard,
    Object.keys(defaultPublicWikiCopy.countryScorecard),
    "countryScorecard"
  );

  if (!countryScorecard.success) {
    return countryScorecard;
  }

  const countryPresenceBoard = parseStringSection(
    payload.countryPresenceBoard,
    Object.keys(defaultPublicWikiCopy.countryPresenceBoard),
    "countryPresenceBoard"
  );

  if (!countryPresenceBoard.success) {
    return countryPresenceBoard;
  }

  const eraPage = parseStringSection(
    payload.eraPage,
    Object.keys(defaultPublicWikiCopy.eraPage),
    "eraPage"
  );

  if (!eraPage.success) {
    return eraPage;
  }

  const categoryPage = parseStringSection(
    payload.categoryPage,
    Object.keys(defaultPublicWikiCopy.categoryPage),
    "categoryPage"
  );

  if (!categoryPage.success) {
    return categoryPage;
  }

  const articlePage = parseStringSection(
    payload.articlePage,
    Object.keys(defaultPublicWikiCopy.articlePage),
    "articlePage"
  );

  if (!articlePage.success) {
    return articlePage;
  }

  return {
    success: true,
    value: {
      shell: shell.value as unknown as PublicWikiCopy["shell"],
      home: home.value as unknown as PublicWikiCopy["home"],
      timeline: timeline.value as unknown as PublicWikiCopy["timeline"],
      search: search.value as unknown as PublicWikiCopy["search"],
      countries: countries.value as unknown as PublicWikiCopy["countries"],
      countryPage: countryPage.value as unknown as PublicWikiCopy["countryPage"],
      countryScorecard: countryScorecard.value as unknown as PublicWikiCopy["countryScorecard"],
      countryPresenceBoard: countryPresenceBoard.value as unknown as PublicWikiCopy["countryPresenceBoard"],
      eraPage: eraPage.value as unknown as PublicWikiCopy["eraPage"],
      categoryPage: categoryPage.value as unknown as PublicWikiCopy["categoryPage"],
      articlePage: articlePage.value as unknown as PublicWikiCopy["articlePage"]
    }
  };
}

function parseStringSection<T extends Record<string, string>>(
  input: unknown,
  keys: string[],
  label: string
): { success: true; value: T } | { success: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { success: false, error: `La sección ${label} es inválida.` };
  }

  const payload = input as Record<string, unknown>;
  const section: Record<string, string> = {};

  for (const key of keys) {
    if (typeof payload[key] !== "string") {
      return { success: false, error: `El campo ${label}.${key} debe ser un texto.` };
    }

    section[key] = payload[key] as string;
  }

  return { success: true, value: section as T };
}

function normalizeScore(value: unknown) {
  const numeric = normalizeOptionalNumber(value);

  if (!numeric) {
    return undefined;
  }

  if (numeric < 1 || numeric > 5) {
    return undefined;
  }

  return numeric;
}

function validateScoreField(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") {
    return { value: undefined };
  }

  const numeric = normalizeScore(value);

  if (numeric === undefined) {
    return { error: `${label} debe estar entre 1 y 5.` };
  }

  return { value: numeric };
}
