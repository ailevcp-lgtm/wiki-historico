import { NextResponse } from "next/server";

import { requireEditorApiAccess } from "@/lib/editor/auth";
import { updateSourceDocumentStatus } from "@/lib/staging/store";
import type { SourceImportStatus } from "@/types/staging";

export const runtime = "nodejs";

const validStatuses: SourceImportStatus[] = ["pending", "parsed", "needs_review", "imported", "failed"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const { id } = await context.params;
  const body = (await request.json()) as { importStatus?: SourceImportStatus };

  if (!body.importStatus || !validStatuses.includes(body.importStatus)) {
    return NextResponse.json(
      { error: "Estado inválido para actualizar la ficha staged." },
      { status: 400 }
    );
  }

  try {
    const updated = await updateSourceDocumentStatus(id, body.importStatus);

    if (!updated) {
      return NextResponse.json({ error: "Documento staged no encontrado." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude actualizar el estado del documento.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
