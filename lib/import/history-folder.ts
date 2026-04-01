import "server-only";

import { promises as fs } from "fs";
import path from "path";

import { getCanonicalCountryBySlug } from "@/lib/import/country-normalization";
import {
  parseCeaDocumentText,
  parseMasterCountriesDocumentText,
  parseMasterHitosDocumentText
} from "@/lib/import/cea-parser";
import {
  getHistoryCountryMapPublicFilePath,
  historyMapsPublicDirectory
} from "@/lib/import/history-assets";
import { detectImportSourceFormat, extractImportText } from "@/lib/import/source-text";
import { slugify } from "@/lib/utils";
import type {
  CountryImportPreview,
  HitoImportPreview,
  ImportPreviewResult
} from "@/types/import";

type HistoryImportMode = "pilot" | "full";

export type HistoryImportBatchResult = {
  results: ImportPreviewResult[];
  errors: Array<{ fileName: string; error: string }>;
  summary: {
    mode: HistoryImportMode;
    availableHitos: number;
    availableCountries: number;
    returnedHitos: number;
    returnedCountries: number;
  };
};

const historyRoot = path.join(process.cwd(), "HISTORIA");

export async function loadHistoryImportBatch(mode: HistoryImportMode = "pilot"): Promise<HistoryImportBatchResult> {
  const errors: Array<{ fileName: string; error: string }> = [];
  const splitBatch = await loadSplitHistoryBatch(errors);

  if (splitBatch) {
    const selectedHitos = mode === "pilot" ? splitBatch.hitos.slice(0, 5) : splitBatch.hitos;
    const selectedCountries = mode === "pilot" ? splitBatch.countries.slice(0, 5) : splitBatch.countries;

    await syncCountryMapAssets(selectedCountries);

    return {
      results: [...selectedHitos, ...selectedCountries],
      errors,
      summary: {
        mode,
        availableHitos: splitBatch.hitos.length,
        availableCountries: splitBatch.countries.length,
        returnedHitos: selectedHitos.length,
        returnedCountries: selectedCountries.length
      }
    };
  }

  const [hitosEntry, countriesEntry] = await Promise.all([
    resolveHistoryEntryName("Hitos pasados en limpio.docx"),
    resolveHistoryEntryName("Fichas país.docx")
  ]);

  if (!hitosEntry) {
    errors.push({
      fileName: "Hitos pasados en limpio.docx",
      error: "No encontré el documento maestro de hitos dentro de HISTORIA."
    });
  }

  if (!countriesEntry) {
    errors.push({
      fileName: "Fichas país.docx",
      error: "No encontré el documento maestro de países dentro de HISTORIA."
    });
  }

  const hitos = hitosEntry ? await parseHistoryDocx(hitosEntry, parseMasterHitosDocumentText, errors) : [];
  const countries = countriesEntry
    ? await parseHistoryDocx(countriesEntry, parseMasterCountriesDocumentText, errors)
    : [];

  const selectedHitos = mode === "pilot" ? hitos.slice(0, 5) : hitos;
  const selectedCountries = mode === "pilot" ? countries.slice(0, 5) : countries;

  await syncCountryMapAssets(selectedCountries);

  return {
    results: [...selectedHitos, ...selectedCountries],
    errors,
    summary: {
      mode,
      availableHitos: hitos.length,
      availableCountries: countries.length,
      returnedHitos: selectedHitos.length,
      returnedCountries: selectedCountries.length
    }
  };
}

async function parseHistoryDocx<T extends ImportPreviewResult>(
  entryName: string,
  parser: (rawText: string, fileName: string) => T[],
  errors: Array<{ fileName: string; error: string }>
) {
  const fullPath = path.join(historyRoot, entryName);

  try {
    const buffer = await fs.readFile(fullPath);
    const rawText = await extractImportText(buffer, entryName);
    return parser(rawText, entryName);
  } catch (error) {
    errors.push({
      fileName: entryName,
      error: error instanceof Error ? error.message : "No pude leer el documento maestro."
    });
    return [];
  }
}

async function loadSplitHistoryBatch(
  errors: Array<{ fileName: string; error: string }>
): Promise<{ hitos: HitoImportPreview[]; countries: CountryImportPreview[] } | undefined> {
  const splitRoot = path.join(historyRoot, "split");
  const [hitoFiles, countryFiles] = await Promise.all([
    listImportFiles(path.join(splitRoot, "hitos")),
    listImportFiles(path.join(splitRoot, "paises"))
  ]);

  if (hitoFiles.length === 0 && countryFiles.length === 0) {
    return undefined;
  }

  const [hitos, countries] = await Promise.all([
    parseSplitFiles<HitoImportPreview>(hitoFiles, "hito", errors),
    parseSplitFiles<CountryImportPreview>(countryFiles, "country", errors)
  ]);

  return { hitos, countries };
}

async function parseSplitFiles<T extends ImportPreviewResult>(
  filePaths: string[],
  expectedKind: T["kind"],
  errors: Array<{ fileName: string; error: string }>
): Promise<T[]> {
  const results: T[] = [];

  for (const filePath of filePaths) {
    const relativeName = path.relative(historyRoot, filePath);

    try {
      const buffer = await fs.readFile(filePath);
      const rawText = await extractImportText(buffer, relativeName);
      const preview = parseCeaDocumentText(rawText, relativeName);

      if (preview.kind === expectedKind) {
        results.push(preview as T);
        continue;
      }

      errors.push({
        fileName: relativeName,
        error: `El archivo separado no se reconoció como ${expectedKind}.`
      });
    } catch (error) {
      errors.push({
        fileName: relativeName,
        error: error instanceof Error ? error.message : "No pude leer el archivo separado."
      });
    }
  }

  return results;
}

async function listImportFiles(rootDirectory: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(rootDirectory, { withFileTypes: true });
    const nestedResults = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(rootDirectory, entry.name);

        if (entry.isDirectory()) {
          return listImportFiles(fullPath);
        }

        if (!entry.isFile() || !detectImportSourceFormat(entry.name)) {
          return [];
        }

        return [fullPath];
      })
    );

    return nestedResults.flat().sort((left, right) => left.localeCompare(right, "es"));
  } catch {
    return [];
  }
}

async function syncCountryMapAssets(previews: CountryImportPreview[]) {
  if (previews.length === 0) {
    return;
  }

  const mapsDirectoryName = await resolveHistoryEntryName("Mapas paises");
  if (!mapsDirectoryName) {
    for (const preview of previews) {
      preview.draft.mapUrl = undefined;
      preview.issues.push({
        level: "warning",
        field: "mapUrl",
        message: "No encontré la carpeta 'Mapas paises' dentro de HISTORIA."
      });
    }
    return;
  }

  const sourceMapsDirectory = path.join(historyRoot, mapsDirectoryName);
  await fs.mkdir(historyMapsPublicDirectory, { recursive: true });

  await Promise.all(
    previews.map(async (preview) => {
      const canonical = getCanonicalCountryBySlug(preview.draft.slug);

      if (!canonical?.sourceMapFileName || !preview.draft.mapUrl) {
        return;
      }

      const sourcePath = path.join(sourceMapsDirectory, canonical.sourceMapFileName);
      const targetPath = getHistoryCountryMapPublicFilePath(preview.draft.slug, canonical.sourceMapFileName);

      try {
        await fs.copyFile(sourcePath, targetPath);
      } catch {
        preview.draft.mapUrl = undefined;
        preview.issues.push({
          level: "warning",
          field: "mapUrl",
          message: `No pude copiar el mapa fuente '${canonical.sourceMapFileName}' para ${preview.draft.name}.`
        });
      }
    })
  );
}

async function resolveHistoryEntryName(expectedName: string) {
  try {
    const entries = await fs.readdir(historyRoot, { withFileTypes: true });
    const expectedKey = slugify(expectedName);
    return entries.find((entry) => slugify(entry.name) === expectedKey)?.name;
  } catch {
    return undefined;
  }
}
