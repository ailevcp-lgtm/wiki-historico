import { NextResponse } from "next/server";

import { requireEditorApiAccess } from "@/lib/editor/auth";
import { extractDocxText } from "@/lib/import/docx";
import { parseCeaDocumentText } from "@/lib/import/cea-parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireEditorApiAccess();

  if (!auth.allowed) {
    return auth.response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Debes adjuntar un archivo .docx para generar la vista previa." },
      { status: 400 }
    );
  }

  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json(
      { error: "Por ahora el importador solo acepta archivos .docx." },
      { status: 400 }
    );
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json(
      { error: "El archivo supera el límite de 8 MB para la vista previa." },
      { status: 413 }
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const rawText = await extractDocxText(Buffer.from(arrayBuffer));
    const preview = parseCeaDocumentText(rawText, file.name);

    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude leer el archivo .docx.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
