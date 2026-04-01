import { NextResponse } from "next/server";

import { requireEditorApiAccess } from "@/lib/editor/auth";
import { parseCeaDocumentText } from "@/lib/import/cea-parser";
import { detectImportSourceFormat, extractImportText } from "@/lib/import/source-text";

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
      { error: "Debes adjuntar un archivo .docx o .md para generar la vista previa." },
      { status: 400 }
    );
  }

  if (!detectImportSourceFormat(file.name)) {
    return NextResponse.json(
      { error: "Por ahora el importador solo acepta archivos .docx o .md." },
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
    const rawText = await extractImportText(Buffer.from(arrayBuffer), file.name);
    const preview = parseCeaDocumentText(rawText, file.name);

    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      {
        error: "No pude leer el archivo fuente.",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
