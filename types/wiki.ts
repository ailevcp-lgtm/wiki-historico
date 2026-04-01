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

export interface WikiShellCopy {
  siteTitle: string;
  siteTagline: string;
  searchPlaceholder: string;
  searchButtonLabel: string;
  navigationSectionTitle: string;
  homeLabel: string;
  timelineLabel: string;
  searchLabel: string;
  countriesLabel: string;
  erasSectionTitle: string;
  categoriesSectionTitle: string;
  blocsSectionTitle: string;
  eraLabelPrefix: string;
}

export interface HomePageCopy {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  timelineSectionTitle: string;
  timelineSectionLinkLabel: string;
  featuredBadgeLabel: string;
  featuredPendingTypeLabel: string;
  featuredEmptyTitle: string;
  featuredEmptyDescription: string;
  featuredReadMoreLabel: string;
  latestSectionTitle: string;
  latestSectionLinkLabel: string;
  latestEmptyMessage: string;
  blocsSectionTitle: string;
  blocsSectionKicker: string;
  directorySectionTitle: string;
  directorySectionDescription: string;
  directorySectionButtonLabel: string;
  statsSectionTitle: string;
  statsSectionKicker: string;
  statsPublishedArticlesLabel: string;
  statsCountriesLabel: string;
  statsCategoriesLabel: string;
  statsErasLabel: string;
}

export interface TimelinePageCopy {
  eyebrow: string;
  title: string;
  description: string;
  allErasLabel: string;
  allTypesLabel: string;
  allBlocsLabel: string;
  filterButtonLabel: string;
  emptyMessage: string;
}

export interface SearchPageCopy {
  eyebrow: string;
  title: string;
  description: string;
  placeholder: string;
  buttonLabel: string;
  emptyQueryMessage: string;
  noResultsTemplate: string;
}

export interface CountriesPageCopy {
  eyebrow: string;
  title: string;
  description: string;
  organCountDescription: string;
  matrixTitle: string;
  matrixKicker: string;
}

export interface CountryPageCopy {
  badgeLabel: string;
  snapshotBadgeTemplate: string;
  summaryFallback: string;
  mapSectionTitle: string;
  profileSectionTitle: string;
  profileFallbackMarkdown: string;
  quickSummaryTitle: string;
  quickSummarySnapshotsLabel: string;
  quickSummaryBlocLabel: string;
  quickSummaryLatestEraLabel: string;
  quickSummaryOrgansLabel: string;
  quickSummaryMapLabel: string;
  quickSummaryNoBlocValue: string;
  quickSummaryNoEraValue: string;
  quickSummaryMapAvailableValue: string;
  quickSummaryMapPendingValue: string;
  noOrgansBadgeLabel: string;
}

export interface CountryScorecardCopy {
  emptyTitle: string;
  emptyDescription: string;
  latestTitle: string;
  snapshotsLabel: string;
  blocLabel: string;
  noBlocValue: string;
  lastMilestoneLabel: string;
  noMilestoneValue: string;
  historyTitle: string;
  referenceColumnLabel: string;
}

export interface CountryPresenceBoardCopy {
  footerText: string;
}

export interface EraPageCopy {
  sectionTitle: string;
}

export interface CategoryPageCopy {
  eyebrow: string;
}

export interface ArticlePageCopy {
  categoriesSectionTitle: string;
  relatedSectionTitle: string;
  tableOfContentsTitle: string;
}

export interface PublicWikiCopy {
  shell: WikiShellCopy;
  home: HomePageCopy;
  timeline: TimelinePageCopy;
  search: SearchPageCopy;
  countries: CountriesPageCopy;
  countryPage: CountryPageCopy;
  countryScorecard: CountryScorecardCopy;
  countryPresenceBoard: CountryPresenceBoardCopy;
  eraPage: EraPageCopy;
  categoryPage: CategoryPageCopy;
  articlePage: ArticlePageCopy;
}

export interface WikiSiteConfig {
  eras: TimelineEra[];
  categories: Category[];
  blocs: Bloc[];
  copy: PublicWikiCopy;
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

export interface HitoReferenceTarget {
  slug: string;
  title: string;
  href: string;
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

export type CountryOrganSlug = "ag" | "cdh" | "csym";

export interface Country {
  slug: string;
  name: string;
  bloc?: string;
  summary: string;
  profileMarkdown: string;
  flagUrl?: string;
  mapUrl?: string;
  organMemberships?: CountryOrganSlug[];
  scores: CountryScore[];
}

export interface NavHeading {
  id: string;
  text: string;
  depth: 2 | 3;
}
