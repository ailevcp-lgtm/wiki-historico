import type { ImportDocumentKind, ImportPreviewResult } from "@/types/import";

export type SourceImportStatus = "pending" | "parsed" | "needs_review" | "imported" | "failed";
export type StagingMode = "local" | "supabase";

export interface StagedSourceDocument {
  id: string;
  sourceName: string;
  sourceFormat: string;
  detectedKind: ImportDocumentKind;
  rawText: string;
  normalizedPayload: ImportPreviewResult;
  targetSlug?: string;
  importStatus: SourceImportStatus;
  parseNotes?: string;
  createdAt: string;
  updatedAt: string;
  stagingMode: StagingMode;
}

export interface PromotionResult {
  documentId: string;
  detectedKind: Exclude<ImportDocumentKind, "unknown">;
  importStatus: SourceImportStatus;
  targetSlug: string;
  targetPath: string;
  destinationMode: StagingMode;
}
