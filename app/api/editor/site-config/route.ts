import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireEditorApiAccess } from "@/lib/editor/auth";
import { parseSiteConfigPayload } from "@/lib/editor/payloads";
import { saveSiteConfig } from "@/lib/site-config/store";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const parsed = parseSiteConfigPayload(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const saved = await saveSiteConfig(parsed.value);
    revalidateConfigPaths(saved);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude guardar la configuración pública.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

function revalidateConfigPaths(config: {
  eras: Array<{ slug: string }>;
  categories: Array<{ slug: string }>;
}) {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/timeline");
  revalidatePath("/search");
  revalidatePath("/countries");
  revalidatePath("/admin");
  revalidatePath("/admin/config");
  revalidatePath("/admin/articles");
  revalidatePath("/admin/countries");

  for (const era of config.eras) {
    revalidatePath(`/era/${era.slug}`);
  }

  for (const category of config.categories) {
    revalidatePath(`/category/${category.slug}`);
  }
}

