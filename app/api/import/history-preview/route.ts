import { NextResponse } from "next/server";

import { requireEditorApiAccess } from "@/lib/editor/auth";
import { loadHistoryImportBatch } from "@/lib/import/history-folder";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const body = (await request.json().catch(() => ({}))) as { mode?: "pilot" | "full" };
  const mode = body.mode === "full" ? "full" : "pilot";

  try {
    const payload = await loadHistoryImportBatch(mode);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude leer la carpeta HISTORIA.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
