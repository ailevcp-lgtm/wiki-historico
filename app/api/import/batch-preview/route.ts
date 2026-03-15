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
  const entries = formData.getAll("files");

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "Debes adjuntar al menos un archivo .docx para generar la vista previa por lote." },
      { status: 400 }
    );
  }

  const results = [];
  const errors = [];

  for (const entry of entries) {
    if (!(entry instanceof File)) {
      continue;
    }

    if (!entry.name.toLowerCase().endsWith(".docx")) {
      errors.push({
        fileName: entry.name,
        error: "Formato no soportado. Solo se aceptan archivos .docx."
      });
      continue;
    }

    if (entry.size > 8 * 1024 * 1024) {
      errors.push({
        fileName: entry.name,
        error: "El archivo supera el límite de 8 MB para la vista previa."
      });
      continue;
    }

    try {
      const arrayBuffer = await entry.arrayBuffer();
      const rawText = await extractDocxText(Buffer.from(arrayBuffer));
      results.push(parseCeaDocumentText(rawText, entry.name));
    } catch (error) {
      errors.push({
        fileName: entry.name,
        error: error instanceof Error ? error.message : "No pude leer el archivo .docx."
      });
    }
  }

  return NextResponse.json({ results, errors });
}
