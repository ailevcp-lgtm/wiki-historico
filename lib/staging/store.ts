import "server-only";

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { unstable_noStore as noStore } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminConfig } from "@/lib/supabase/config";
import type { ImportPreviewResult } from "@/types/import";
import type { SourceImportStatus, StagedSourceDocument, StagingMode } from "@/types/staging";

const localFilePath = path.join(process.cwd(), "storage", "source-documents.local.json");

type SourceDocumentRow = {
  id: string;
  source_name: string;
  source_format: string;
  detected_kind: StagedSourceDocument["detectedKind"];
  raw_text: string;
  normalized_payload: ImportPreviewResult;
  target_slug: string | null;
  import_status: SourceImportStatus;
  parse_notes: string | null;
  created_at: string;
  updated_at: string;
};

export function getStagingMode(): StagingMode {
  return hasSupabaseAdminConfig() ? "supabase" : "local";
}

export async function stageImportPreviews(previews: ImportPreviewResult[]): Promise<StagedSourceDocument[]> {
  const rows = dedupeIncomingRows(previews.map(previewToRow));

  if (getStagingMode() === "supabase") {
    const supabase = await createSupabaseAdminClient();
    const { data: existingRows, error: existingRowsError } = await supabase
      .from("source_documents")
      .select("*");

    if (existingRowsError) {
      throw new Error(existingRowsError.message);
    }

    const existingByKey = new Map(
      ((existingRows ?? []) as SourceDocumentRow[]).map((row) => [buildSourceDocumentKeyFromRow(row), row] as const)
    );
    const stagedRows: SourceDocumentRow[] = [];

    for (const row of rows) {
      const existing = existingByKey.get(buildSourceDocumentKeyFromRow(row));

      if (existing) {
        const { data, error } = await supabase
          .from("source_documents")
          .update(stripTimestamps(mergeSourceDocumentRow(existing, row)))
          .eq("id", existing.id)
          .select("*")
          .single();

        if (error || !data) {
          throw new Error(error?.message ?? "No pude actualizar el documento staged.");
        }

        stagedRows.push(data as SourceDocumentRow);
        continue;
      }

      const { data, error } = await supabase
        .from("source_documents")
        .insert(stripTimestamps(row))
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "No pude guardar el documento staged.");
      }

      stagedRows.push(data as SourceDocumentRow);
    }

    return stagedRows.map((row) => mapRow(row, "supabase"));
  }

  const existing = await readLocalRows();
  const nextRows = [...rows];

  for (const row of existing) {
    const rowKey = buildSourceDocumentKeyFromRow(row);
    const nextIndex = nextRows.findIndex((entry) => buildSourceDocumentKeyFromRow(entry) === rowKey);

    if (nextIndex >= 0) {
      nextRows[nextIndex] = mergeSourceDocumentRow(row, nextRows[nextIndex]);
      continue;
    }

    nextRows.push(row);
  }

  await writeLocalRows(nextRows);
  return rows.map((row) => {
    const storedRow = nextRows.find(
      (entry) => buildSourceDocumentKeyFromRow(entry) === buildSourceDocumentKeyFromRow(row)
    );

    return mapRow(storedRow ?? row, "local");
  });
}

export async function listSourceDocuments(): Promise<StagedSourceDocument[]> {
  noStore();

  if (getStagingMode() === "supabase") {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("source_documents")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapRow(row as SourceDocumentRow, "supabase"));
  }

  const rows = await readLocalRows();
  return rows.map((row) => mapRow(row, "local"));
}

export async function clearSourceDocuments(): Promise<number> {
  const documents = await listSourceDocuments();

  if (getStagingMode() === "supabase") {
    const supabase = await createSupabaseAdminClient();
    const { error } = await supabase
      .from("source_documents")
      .delete()
      .not("id", "is", null);

    if (error) {
      throw new Error(error.message);
    }

    return documents.length;
  }

  await writeLocalRows([]);
  return documents.length;
}

export async function getSourceDocumentById(id: string): Promise<StagedSourceDocument | undefined> {
  noStore();

  if (getStagingMode() === "supabase") {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("source_documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data as SourceDocumentRow, "supabase") : undefined;
  }

  const rows = await readLocalRows();
  const row = rows.find((entry) => entry.id === id);
  return row ? mapRow(row, "local") : undefined;
}

export async function updateSourceDocumentStatus(
  id: string,
  importStatus: SourceImportStatus,
  targetSlug?: string
): Promise<StagedSourceDocument | undefined> {
  if (getStagingMode() === "supabase") {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("source_documents")
      .update({
        import_status: importStatus,
        ...(targetSlug ? { target_slug: targetSlug } : {})
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data as SourceDocumentRow, "supabase") : undefined;
  }

  const rows = await readLocalRows();
  const nextRows = rows.map((row) =>
    row.id === id
      ? {
          ...row,
          import_status: importStatus,
          target_slug: targetSlug ?? row.target_slug,
          updated_at: new Date().toISOString()
        }
      : row
  );

  await writeLocalRows(nextRows);
  const updated = nextRows.find((row) => row.id === id);
  return updated ? mapRow(updated, "local") : undefined;
}

export async function updateSourceDocumentNormalizedPayload(
  id: string,
  normalizedPayload: ImportPreviewResult
): Promise<StagedSourceDocument | undefined> {
  const targetSlug = deriveTargetSlug(normalizedPayload);

  if (getStagingMode() === "supabase") {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("source_documents")
      .update({
        normalized_payload: normalizedPayload,
        target_slug: targetSlug
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data as SourceDocumentRow, "supabase") : undefined;
  }

  const rows = await readLocalRows();
  const nextRows = rows.map((row) =>
    row.id === id
      ? {
          ...row,
          normalized_payload: normalizedPayload,
          target_slug: targetSlug,
          updated_at: new Date().toISOString()
        }
      : row
  );

  await writeLocalRows(nextRows);
  const updated = nextRows.find((row) => row.id === id);
  return updated ? mapRow(updated, "local") : undefined;
}

function previewToRow(preview: ImportPreviewResult): SourceDocumentRow {
  const now = new Date().toISOString();
  const hasErrors = preview.issues.some((issue) => issue.level === "error");
  const hasWarnings = preview.issues.some((issue) => issue.level === "warning");
  const targetSlug =
    preview.kind === "hito"
      ? preview.draft.slug
      : preview.kind === "country"
        ? preview.draft.slug
        : null;

  return {
    id: randomUUID(),
    source_name: preview.fileName,
    source_format: inferSourceFormat(preview.fileName),
    detected_kind: preview.kind,
    raw_text: preview.normalizedLines.join("\n"),
    normalized_payload: preview,
    target_slug: targetSlug,
    import_status: hasErrors || hasWarnings ? "needs_review" : "parsed",
    parse_notes: preview.issues.map((issue) => `${issue.level}: ${issue.message}`).join("\n") || null,
    created_at: now,
    updated_at: now
  };
}

function dedupeIncomingRows(rows: SourceDocumentRow[]) {
  const deduped = new Map<string, SourceDocumentRow>();

  for (const row of rows) {
    deduped.set(buildSourceDocumentKeyFromRow(row), row);
  }

  return [...deduped.values()];
}

function mergeSourceDocumentRow(existing: SourceDocumentRow, next: SourceDocumentRow): SourceDocumentRow {
  return {
    ...existing,
    source_name: next.source_name,
    source_format: next.source_format,
    detected_kind: next.detected_kind,
    raw_text: next.raw_text,
    normalized_payload: next.normalized_payload,
    target_slug: next.target_slug,
    import_status: next.import_status,
    parse_notes: next.parse_notes,
    updated_at: next.updated_at
  };
}

function inferSourceFormat(fileName: string) {
  const normalized = fileName.toLowerCase();

  if (normalized.includes(".md")) {
    return "md";
  }

  if (normalized.includes(".docx")) {
    return "docx";
  }

  return "text";
}

function deriveTargetSlug(preview: ImportPreviewResult) {
  if (preview.kind === "hito" || preview.kind === "country") {
    return preview.draft.slug;
  }

  return null;
}

function buildSourceDocumentKeyFromRow(row: Pick<SourceDocumentRow, "detected_kind" | "target_slug" | "source_name" | "normalized_payload">) {
  if (row.detected_kind === "hito") {
    const preview = row.normalized_payload;
    const hitoId = preview.kind === "hito" ? preview.draft.hitoId : undefined;

    return hitoId ? `hito:${normalizeSourceDocumentKey(hitoId)}` : `hito:${normalizeSourceDocumentKey(row.target_slug ?? row.source_name)}`;
  }

  if (row.detected_kind === "country") {
    return `country:${normalizeSourceDocumentKey(row.target_slug ?? row.source_name)}`;
  }

  return `unknown:${normalizeSourceDocumentKey(row.source_name)}`;
}

function normalizeSourceDocumentKey(value: string) {
  return value.trim().toLowerCase();
}

function mapRow(row: SourceDocumentRow, stagingMode: StagingMode): StagedSourceDocument {
  return {
    id: row.id,
    sourceName: row.source_name,
    sourceFormat: row.source_format,
    detectedKind: row.detected_kind,
    rawText: row.raw_text,
    normalizedPayload: row.normalized_payload,
    targetSlug: row.target_slug ?? undefined,
    importStatus: row.import_status,
    parseNotes: row.parse_notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stagingMode
  };
}

function stripTimestamps(row: SourceDocumentRow) {
  return {
    source_name: row.source_name,
    source_format: row.source_format,
    detected_kind: row.detected_kind,
    raw_text: row.raw_text,
    normalized_payload: row.normalized_payload,
    target_slug: row.target_slug,
    import_status: row.import_status,
    parse_notes: row.parse_notes
  };
}

async function readLocalRows(): Promise<SourceDocumentRow[]> {
  await ensureLocalStore();
  const content = await fs.readFile(localFilePath, "utf8");
  const data = JSON.parse(content) as SourceDocumentRow[];
  return data.sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

async function writeLocalRows(rows: SourceDocumentRow[]): Promise<void> {
  await ensureLocalStore();
  await fs.writeFile(localFilePath, JSON.stringify(rows, null, 2));
}

async function ensureLocalStore(): Promise<void> {
  await fs.mkdir(path.dirname(localFilePath), { recursive: true });
  try {
    await fs.access(localFilePath);
  } catch {
    await fs.writeFile(localFilePath, "[]");
  }
}
