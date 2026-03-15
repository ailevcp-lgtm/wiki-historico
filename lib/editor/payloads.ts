import type { Article, ArticleStatus, ArticleType, Country, CountryScore } from "@/types/wiki";

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
      scores: scores.value
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
