export type ArticleType =
  | "event"
  | "organization"
  | "treaty"
  | "technology"
  | "geography"
  | "society"
  | "summit"
  | "bloc"
  | "conflict";

export type ArticleStatus = "draft" | "review" | "published";

export interface TimelineEra {
  slug: string;
  number: number;
  name: string;
  yearStart: number;
  yearEnd: number;
  theme: string;
  description: string;
  color: string;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  icon?: string;
}

export interface Bloc {
  slug: string;
  name: string;
  summary: string;
  color: string;
}

export type InfoboxPrimitive = string | number | null | undefined;
export type InfoboxValue = InfoboxPrimitive | string[] | string[][];

export type InfoboxData = {
  type: ArticleType;
} & Record<string, InfoboxValue>;

export interface Article {
  slug: string;
  title: string;
  type: ArticleType;
  content: string;
  summary: string;
  infobox?: InfoboxData;
  categorySlugs: string[];
  relatedSlugs: string[];
  blocSlugs?: string[];
  eraSlug?: string;
  hitoId?: string;
  yearStart?: number;
  yearEnd?: number;
  imageUrl?: string;
  status: ArticleStatus;
  author?: string;
  featured?: boolean;
}

export interface CountryScore {
  eraSlug?: string;
  hitoId?: string;
  climateExposure?: number;
  stateCapacity?: number;
  powerResources?: number;
  techDependency?: number;
  demographicPressure?: number;
  socialCohesion?: number;
  economicVulnerability?: number;
  climateTrend?: "up" | "down" | "stable";
  stateTrend?: "up" | "down" | "stable";
  powerTrend?: "up" | "down" | "stable";
  techTrend?: "up" | "down" | "stable";
  demographicTrend?: "up" | "down" | "stable";
  socialTrend?: "up" | "down" | "stable";
  economicTrend?: "up" | "down" | "stable";
  notes?: string;
}

export interface Country {
  slug: string;
  name: string;
  bloc?: string;
  summary: string;
  profileMarkdown: string;
  flagUrl?: string;
  scores: CountryScore[];
}

export interface NavHeading {
  id: string;
  text: string;
  depth: 2 | 3;
}
