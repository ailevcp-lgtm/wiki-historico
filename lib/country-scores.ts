import type { CountryScore, TimelineEra } from "@/types/wiki";

export const countryScoreMetrics = [
  {
    valueKey: "climateExposure",
    trendKey: "climateTrend",
    label: "Exposición climática",
    shortLabel: "Clima"
  },
  {
    valueKey: "stateCapacity",
    trendKey: "stateTrend",
    label: "Capacidad estatal",
    shortLabel: "Estado"
  },
  {
    valueKey: "powerResources",
    trendKey: "powerTrend",
    label: "Recursos de poder",
    shortLabel: "Poder"
  },
  {
    valueKey: "techDependency",
    trendKey: "techTrend",
    label: "Dependencia tecnológica",
    shortLabel: "Tecnología"
  },
  {
    valueKey: "demographicPressure",
    trendKey: "demographicTrend",
    label: "Presión demográfica",
    shortLabel: "Demografía"
  },
  {
    valueKey: "socialCohesion",
    trendKey: "socialTrend",
    label: "Cohesión social",
    shortLabel: "Cohesión"
  },
  {
    valueKey: "economicVulnerability",
    trendKey: "economicTrend",
    label: "Vulnerabilidad económica",
    shortLabel: "Economía"
  }
] as const;

export type CountryScoreMetric = (typeof countryScoreMetrics)[number];
export type CountryScoreValueKey = CountryScoreMetric["valueKey"];
export type CountryScoreTrendKey = CountryScoreMetric["trendKey"];

export const trendOptions = [
  { value: "up", label: "↑ Sube" },
  { value: "stable", label: "↔ Estable" },
  { value: "down", label: "↓ Baja" }
] as const;

export function getCountryScoreValue(score: CountryScore, key: CountryScoreValueKey) {
  return score[key];
}

export function getCountryScoreTrend(score: CountryScore, key: CountryScoreTrendKey) {
  return score[key];
}

export function getTrendSymbol(trend?: CountryScore[CountryScoreTrendKey]) {
  if (trend === "up") {
    return "↑";
  }

  if (trend === "down") {
    return "↓";
  }

  return "↔";
}

export function getScoreTone(value?: number) {
  if (!value) {
    return "bg-white";
  }

  if (value <= 2) {
    return "bg-[#f2f7ff]";
  }

  if (value === 3) {
    return "bg-[#eef3e6]";
  }

  if (value === 4) {
    return "bg-[#f8efd9]";
  }

  return "bg-[#f7e0e0]";
}

export function sortCountryScores(scores: CountryScore[], eras: TimelineEra[]) {
  const eraIndex = new Map(eras.map((era) => [era.slug, era.number]));

  return [...scores].sort((left, right) => {
    const leftEraOrder = left.eraSlug ? eraIndex.get(left.eraSlug) ?? 999 : 999;
    const rightEraOrder = right.eraSlug ? eraIndex.get(right.eraSlug) ?? 999 : 999;

    if (leftEraOrder !== rightEraOrder) {
      return leftEraOrder - rightEraOrder;
    }

    return (left.hitoId ?? "").localeCompare(right.hitoId ?? "", "es");
  });
}

export function describeScoreSnapshot(score: CountryScore, eras: TimelineEra[]) {
  const eraLabel = score.eraSlug
    ? eras.find((era) => era.slug === score.eraSlug)?.name ?? score.eraSlug
    : "Sin era";

  if (score.hitoId) {
    return `${eraLabel} · ${score.hitoId}`;
  }

  return eraLabel;
}
