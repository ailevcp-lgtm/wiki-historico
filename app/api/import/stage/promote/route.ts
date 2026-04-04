import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { promoteSourceDocument } from "@/lib/content/store";
import { requireEditorApiAccess } from "@/lib/editor/auth";
import { getEditableArticleBySlug, getEditableCountryBySlug } from "@/lib/repository";
import { getSourceDocumentById } from "@/lib/staging/store";
import {
  revalidateArticlePaths,
  revalidateCorePaths,
  revalidateCountryPaths
} from "@/lib/wiki-revalidation";
import type { BatchPromotionFailure, BatchPromotionResult, PromotionResult } from "@/types/staging";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as { ids?: string[] } | null;
  const requestedIds = Array.from(
    new Set(
      (Array.isArray(body?.ids) ? body?.ids : []).filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0
      )
    )
  );

  if (requestedIds.length === 0) {
    return NextResponse.json(
      { error: "No se recibieron documentos para promover." },
      { status: 400 }
    );
  }

  const promoted: PromotionResult[] = [];
  const failed: BatchPromotionFailure[] = [];

  for (const id of requestedIds) {
    const document = await getSourceDocumentById(id);

    if (!document) {
      failed.push({
        documentId: id,
        detail: "Documento staged no encontrado."
      });
      continue;
    }

    if (document.detectedKind === "unknown") {
      failed.push({
        documentId: id,
        sourceName: document.sourceName,
        detail: "No se puede promover una ficha sin tipo reconocido."
      });
      continue;
    }

    if (document.importStatus === "imported") {
      failed.push({
        documentId: id,
        sourceName: document.sourceName,
        detail: "La ficha ya fue promovida anteriormente."
      });
      continue;
    }

    try {
      const result = await promoteSourceDocument(id);
      promoted.push(result);
      await revalidatePromotionPaths(id, result);
    } catch (error) {
      failed.push({
        documentId: id,
        sourceName: document.sourceName,
        detail: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  const payload: BatchPromotionResult = {
    requestedCount: requestedIds.length,
    promoted,
    failed
  };

  return NextResponse.json(payload);
}

async function revalidatePromotionPaths(id: string, result: PromotionResult) {
  await revalidateCorePaths();
  revalidatePath(`/admin/review/${id}`);

  if (result.detectedKind === "country") {
    const country = await getEditableCountryBySlug(result.targetSlug);

    if (country) {
      await revalidateCountryPaths(country);
    } else {
      revalidatePath(result.targetPath);
      revalidatePath(`/country/${result.targetSlug}`);
    }

    return;
  }

  const article = await getEditableArticleBySlug(result.targetSlug);

  if (article) {
    await revalidateArticlePaths(article);
    return;
  }

  revalidatePath(`/article/${result.targetSlug}`);
}
