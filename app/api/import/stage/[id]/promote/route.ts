import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireEditorApiAccess } from "@/lib/editor/auth";
import { promoteSourceDocument } from "@/lib/content/store";

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

    revalidatePath("/");
    revalidatePath("/timeline");
    revalidatePath("/search");
    revalidatePath("/admin/articles");
    revalidatePath("/admin/countries");
    revalidatePath("/admin/review");
    revalidatePath(`/admin/review/${id}`);
    if (result.detectedKind === "country") {
      revalidatePath(result.targetPath);
      revalidatePath(`/country/${result.targetSlug}`);
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
