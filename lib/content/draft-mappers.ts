import type { CountryDraftCandidate, CountryScoreDraft, HitoDraftCandidate } from "@/types/import";
import type { Article, Country, CountryScore } from "@/types/wiki";

type DraftScoreMetricKey =
  | "climate_exposure"
  | "state_capacity"
  | "power_resources"
  | "tech_dependency"
  | "demographic_pressure"
  | "social_cohesion"
  | "economic_vulnerability";

export function mapDraftToArticle(draft: HitoDraftCandidate): Article {
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
    imageUrl: draft.imageUrl,
    status: "review",
    author: "Importador CEA"
  };
}

export function mapDraftToCountry(draft: CountryDraftCandidate): Country {
  const currentScore = mapDraftScores(draft);
  const scores = [
    ...(draft.historicalScores ?? []),
    ...(hasCountryScorePayload(currentScore) || (draft.historicalScores?.length ?? 0) === 0 ? [currentScore] : [])
  ];

  return {
    slug: draft.slug,
    name: draft.name,
    bloc: draft.bloc,
    summary: draft.summary,
    profileMarkdown: draft.profileMarkdown,
    flagUrl: draft.flagUrl,
    mapUrl: draft.mapUrl,
    organMemberships: draft.organMemberships,
    scores
  };
}

function mapDraftScores(draft: CountryDraftCandidate): CountryScore {
  const scoreMap = new Map<DraftScoreMetricKey, CountryScoreDraft>();

  for (const score of draft.scores) {
    const normalizedKey = normalizeCountryDraftScoreVariable(score.variable);

    if (normalizedKey) {
      scoreMap.set(normalizedKey, score);
    }
  }

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

export function normalizeCountryDraftScoreVariable(value: string): DraftScoreMetricKey | undefined {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (normalized.includes("exposicion climatica")) {
    return "climate_exposure";
  }

  if (normalized.includes("capacidad estatal")) {
    return "state_capacity";
  }

  if (normalized.includes("recursos de poder")) {
    return "power_resources";
  }

  if (normalized.includes("dependencia tech externa") || normalized.includes("dependencia tecnologica")) {
    return "tech_dependency";
  }

  if (normalized.includes("presion demografica")) {
    return "demographic_pressure";
  }

  if (normalized.includes("cohesion social")) {
    return "social_cohesion";
  }

  if (normalized.includes("vulnerabilidad economica")) {
    return "economic_vulnerability";
  }

  return undefined;
}

function hasCountryScorePayload(score: CountryScore) {
  return (
    Boolean(score.hitoId || score.notes) ||
    [
      score.climateExposure,
      score.stateCapacity,
      score.powerResources,
      score.techDependency,
      score.demographicPressure,
      score.socialCohesion,
      score.economicVulnerability
    ].some((value) => value !== undefined)
  );
}
