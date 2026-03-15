import { NextResponse } from "next/server";

import { requireEditorApiAccess } from "@/lib/editor/auth";
import { stageImportPreviews } from "@/lib/staging/store";
import type { ImportPreviewResult } from "@/types/import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const body = (await request.json()) as { results?: ImportPreviewResult[] };

  if (!Array.isArray(body.results) || body.results.length === 0) {
    return NextResponse.json(
      { error: "No se recibieron previews para guardar en la cola editorial." },
      { status: 400 }
    );
  }

  try {
    const staged = await stageImportPreviews(body.results);

    return NextResponse.json({
      stagedCount: staged.length,
      staged
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude guardar el lote en staging.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
