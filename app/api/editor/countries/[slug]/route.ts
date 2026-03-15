import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { saveCountry } from "@/lib/content/store";
import { requireEditorApiAccess } from "@/lib/editor/auth";
import { parseCountryPayload } from "@/lib/editor/payloads";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const { slug } = await context.params;
  const parsed = parseCountryPayload(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.value.slug !== slug) {
    return NextResponse.json(
      { error: "No puedes cambiar el slug de un país existente desde esta ruta." },
      { status: 400 }
    );
  }

  try {
    const saved = await saveCountry(parsed.value);
    revalidateCountryPaths(saved.slug);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude guardar el país.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

function revalidateCountryPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/admin/countries");
  revalidatePath(`/admin/countries/${slug}`);
  revalidatePath(`/country/${slug}`);
}
