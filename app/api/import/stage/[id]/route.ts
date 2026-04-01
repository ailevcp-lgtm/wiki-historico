import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireEditorApiAccess } from "@/lib/editor/auth";
import {
  getSourceDocumentById,
  updateSourceDocumentNormalizedPayload,
  updateSourceDocumentStatus
} from "@/lib/staging/store";
import type { ImportPreviewResult } from "@/types/import";
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
  const body = (await request.json()) as {
    importStatus?: SourceImportStatus;
    normalizedPayload?: ImportPreviewResult;
  };

  try {
    if (body.normalizedPayload) {
      const document = await getSourceDocumentById(id);

      if (!document) {
        return NextResponse.json({ error: "Documento staged no encontrado." }, { status: 404 });
      }

      if (
        document.detectedKind === "unknown" ||
        body.normalizedPayload.kind !== document.detectedKind
      ) {
        return NextResponse.json(
          { error: "El payload editado no coincide con el tipo detectado del documento." },
          { status: 400 }
        );
      }

      const updated = await updateSourceDocumentNormalizedPayload(id, body.normalizedPayload);

      if (!updated) {
        return NextResponse.json({ error: "Documento staged no encontrado." }, { status: 404 });
      }

      revalidatePath("/admin/review");
      revalidatePath(`/admin/review/${id}`);
      return NextResponse.json(updated);
    }

    if (!body.importStatus || !validStatuses.includes(body.importStatus)) {
      return NextResponse.json(
        { error: "Estado inválido para actualizar la ficha staged." },
        { status: 400 }
      );
    }

    const updated = await updateSourceDocumentStatus(id, body.importStatus);

    if (!updated) {
      return NextResponse.json({ error: "Documento staged no encontrado." }, { status: 404 });
    }

    revalidatePath("/admin/review");
    revalidatePath(`/admin/review/${id}`);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude actualizar el documento staged.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
