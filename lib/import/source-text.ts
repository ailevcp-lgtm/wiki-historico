import path from "path";

import { extractDocxText } from "@/lib/import/docx";

export type ImportSourceFormat = "docx" | "md";

export function detectImportSourceFormat(fileName: string): ImportSourceFormat | undefined {
  const extension = path.extname(fileName).trim().toLowerCase();

  if (extension === ".docx") {
    return "docx";
  }

  if (extension === ".md") {
    return "md";
  }

  return undefined;
}

export async function extractImportText(buffer: Buffer, fileName: string): Promise<string> {
  const format = detectImportSourceFormat(fileName);

  if (format === "docx") {
    return extractDocxText(buffer, fileName);
  }

  if (format === "md") {
    return buffer.toString("utf8").replace(/^\uFEFF/, "");
  }

  throw new Error("Formato no soportado. Solo se aceptan archivos .docx o .md.");
}
