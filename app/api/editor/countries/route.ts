import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { saveCountry } from "@/lib/content/store";
import { requireEditorApiAccess } from "@/lib/editor/auth";
import { parseCountryPayload } from "@/lib/editor/payloads";
import { getEditableCountryBySlug } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const parsed = parseCountryPayload(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await getEditableCountryBySlug(parsed.value.slug);

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un país o región con ese slug." },
      { status: 409 }
    );
  }

  try {
    const saved = await saveCountry(parsed.value);
    revalidateCountryPaths(saved.slug);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude crear el país.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

function revalidateCountryPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/countries");
  revalidatePath("/admin/countries");
  revalidatePath(`/admin/countries/${slug}`);
  revalidatePath(`/country/${slug}`);
}
