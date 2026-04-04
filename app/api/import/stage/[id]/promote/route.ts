import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireEditorApiAccess } from "@/lib/editor/auth";
import { promoteSourceDocument } from "@/lib/content/store";
import { getEditableArticleBySlug, getEditableCountryBySlug } from "@/lib/repository";
import {
  revalidateArticlePaths,
  revalidateCorePaths,
  revalidateCountryPaths
} from "@/lib/wiki-revalidation";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const result = await promoteSourceDocument(id);

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
    } else {
      const article = await getEditableArticleBySlug(result.targetSlug);

      if (article) {
        await revalidateArticlePaths(article);
      } else {
        revalidatePath(`/article/${result.targetSlug}`);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude promover el documento staged.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
