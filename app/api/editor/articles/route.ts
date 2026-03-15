import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { saveArticle } from "@/lib/content/store";
import { requireEditorApiAccess } from "@/lib/editor/auth";
import { parseArticlePayload } from "@/lib/editor/payloads";
import { getEditableArticleBySlug, getNavigationData } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const parsed = parseArticlePayload(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await getEditableArticleBySlug(parsed.value.slug);

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un artículo con ese slug." },
      { status: 409 }
    );
  }

  try {
    const saved = await saveArticle(parsed.value);
    revalidateArticlePaths(saved);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude crear el artículo.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

function revalidateArticlePaths(article: { slug: string; categorySlugs: string[]; eraSlug?: string }) {
  revalidatePath("/");
  revalidatePath("/timeline");
  revalidatePath("/search");
  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${article.slug}`);
  revalidatePath(`/article/${article.slug}`);

  if (article.eraSlug) {
    revalidatePath(`/era/${article.eraSlug}`);
  }

  for (const categorySlug of article.categorySlugs) {
    revalidatePath(`/category/${categorySlug}`);
  }

  const navigation = getNavigationData();

  for (const era of navigation.eras) {
    revalidatePath(`/era/${era.slug}`);
  }

  for (const category of navigation.categories) {
    revalidatePath(`/category/${category.slug}`);
  }
}
