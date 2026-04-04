import { NextResponse } from "next/server";

import { publishAllReviewArticles } from "@/lib/content/store";
import { requireEditorApiAccess } from "@/lib/editor/auth";
import { revalidateArticlePaths, revalidateCorePaths } from "@/lib/wiki-revalidation";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  try {
    const updatedArticles = await publishAllReviewArticles();

    if (updatedArticles.length > 0) {
      await revalidateArticlePaths(updatedArticles);
    } else {
      await revalidateCorePaths();
    }

    return NextResponse.json({
      updatedCount: updatedArticles.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude publicar los artículos en review.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
