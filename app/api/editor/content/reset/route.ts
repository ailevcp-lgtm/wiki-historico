import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { clearPersistedWikiContent } from "@/lib/content/store";
import { requireEditorApiAccess } from "@/lib/editor/auth";
import { clearSourceDocuments } from "@/lib/staging/store";
import {
  revalidateArticlePaths,
  revalidateCorePaths,
  revalidateCountryPaths
} from "@/lib/wiki-revalidation";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  try {
    const [content, stagedCount] = await Promise.all([
      clearPersistedWikiContent(),
      clearSourceDocuments()
    ]);

    await revalidateCorePaths();
    revalidatePath("/admin/import");

    if (content.articles.length > 0) {
      await revalidateArticlePaths(content.articles);
    }

    if (content.countries.length > 0) {
      await revalidateCountryPaths(content.countries);
    }

    return NextResponse.json({
      removedArticles: content.articles.length,
      removedCountries: content.countries.length,
      removedStagedDocuments: stagedCount
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude limpiar el contenido de pruebas.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
