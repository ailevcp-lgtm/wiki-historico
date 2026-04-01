import type { ArticleType, CountryOrganSlug, CountryScore, InfoboxData } from "@/types/wiki";

export type ImportIssueLevel = "error" | "warning" | "info";
export type ImportDocumentKind = "hito" | "country" | "unknown";

export interface ImportIssue {
  level: ImportIssueLevel;
  message: string;
  field?: string;
}

export interface HitoDraftCandidate {
  title: string;
  slug: string;
  type: ArticleType;
  summary: string;
  eraSlug?: string;
  hitoId?: string;
  yearStart?: number;
  yearEnd?: number;
  categorySlugs: string[];
  infobox?: InfoboxData;
  imageUrl?: string;
  markdown: string;
  sourceFields: {
    sourceType?: string;
    location?: string;
    actors?: string;
    eraContext?: string;
    connectionHints: string[];
  };
}

export interface CountryScoreDraft {
  variable: string;
  score?: number;
  trend?: "up" | "down" | "stable";
  notes?: string;
}

export interface CountryDraftCandidate {
  name: string;
  slug: string;
  bloc?: string;
  hitoReference?: string;
  eraSlug?: string;
  summary: string;
  profileMarkdown: string;
  flagUrl?: string;
  mapUrl?: string;
  organMemberships?: CountryOrganSlug[];
  scores: CountryScoreDraft[];
  historicalScores?: CountryScore[];
}

interface BaseImportPreview {
  kind: ImportDocumentKind;
  fileName: string;
  templateName: string;
  rawTextPreview: string;
  normalizedLines: string[];
  issues: ImportIssue[];
}

export interface HitoImportPreview extends BaseImportPreview {
  kind: "hito";
  draft: HitoDraftCandidate;
  extractedFields: Record<string, string>;
  extractedSections: Record<string, string[]>;
}

export interface CountryImportPreview extends BaseImportPreview {
  kind: "country";
  draft: CountryDraftCandidate;
  extractedFields: Record<string, string>;
  extractedNarrative: Record<string, string>;
}

export interface UnknownImportPreview extends BaseImportPreview {
  kind: "unknown";
}

export type ImportPreviewResult = HitoImportPreview | CountryImportPreview | UnknownImportPreview;
