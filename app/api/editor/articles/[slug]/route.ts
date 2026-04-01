import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { saveArticle, updateArticleStatus } from "@/lib/content/store";
import { requireEditorApiAccess } from "@/lib/editor/auth";
import { parseArticlePayload } from "@/lib/editor/payloads";
import { getNavigationData } from "@/lib/repository";
import type { ArticleStatus } from "@/types/wiki";

const validStatuses: ArticleStatus[] = ["draft", "review", "published"];

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const { slug } = await context.params;
  const body = (await request.json()) as { status?: ArticleStatus };

  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Estado de artículo inválido." }, { status: 400 });
  }

  try {
    const updated = await updateArticleStatus(slug, body.status);

    if (!updated) {
      return NextResponse.json({ error: "Artículo no encontrado." }, { status: 404 });
    }

    await revalidateArticlePaths(updated.slug, updated.categorySlugs, updated.eraSlug);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude actualizar el estado del artículo.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const { slug } = await context.params;
  const parsed = parseArticlePayload(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.value.slug !== slug) {
    return NextResponse.json(
      { error: "No puedes cambiar el slug de un artículo existente desde esta ruta." },
      { status: 400 }
    );
  }

  try {
    const saved = await saveArticle(parsed.value);
    await revalidateArticlePaths(saved.slug, saved.categorySlugs, saved.eraSlug);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude guardar el artículo.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

async function revalidateArticlePaths(slug: string, categorySlugs: string[], eraSlug?: string) {
  revalidatePath("/");
  revalidatePath("/timeline");
  revalidatePath("/search");
  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${slug}`);
  revalidatePath(`/article/${slug}`);

  if (eraSlug) {
    revalidatePath(`/era/${eraSlug}`);
  }

  for (const categorySlug of categorySlugs) {
    revalidatePath(`/category/${categorySlug}`);
  }

  const navigation = await getNavigationData();

  for (const era of navigation.eras) {
    revalidatePath(`/era/${era.slug}`);
  }

  for (const category of navigation.categories) {
    revalidatePath(`/category/${category.slug}`);
  }
}
