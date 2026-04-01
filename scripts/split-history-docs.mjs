import { promises as fs } from "fs";
import path from "path";

import mammoth from "mammoth";

const historyRoot = path.join(process.cwd(), "HISTORIA");
const outputRoot = path.join(historyRoot, "split");
const publicHistoryDocsImagesRoot = path.join(process.cwd(), "public", "images", "history-docs");
const publicHistoryDocsImagesBasePath = "/images/history-docs";

const HITO_FIELD_LABELS = [
  "Nombre del Hito",
  "ID del Hito",
  "Período",
  "Tipo",
  "Ubicación / Alcance",
  "Actores principales",
  "Era / Contexto"
];

const HITO_SECTION_LABELS = [
  "1. ANTECEDENTES",
  "2. DESARROLLO",
  "3. CONSECUENCIAS INMEDIATAS",
  "4. CONSECUENCIAS A LARGO PLAZO",
  "5. PAÍSES / REGIONES AFECTADOS",
  "6. DATOS CLAVE PARA LA WIKI",
  "7. CONEXIONES CON OTROS HITOS",
  "Metadatos para la Wiki",
  "Título del artículo wiki",
  "Categorías wiki",
  "Infobox a usar",
  "Imagen sugerida",
  "Autor / Responsable",
  "Estado"
];

const COUNTRY_FIELD_LABELS = [
  "País / Región",
  "Bloque (2100)",
  "Bloque (2085)",
  "Capital",
  "Extensión Km2",
  "Población",
  "Representante",
  "Mapa",
  "Hito de referencia",
  "Período evaluado"
];

const COUNTRY_SECTION_LABELS = [
  "Variables del Mundo (puntuar 1 a 5)",
  "PUNTAJE TOTAL",
  "Perfil Narrativo del País",
  "Perfil Narrativo de la organización",
  "Historial de Puntajes por Era (opcional)"
];

const KNOWN_PLACEHOLDERS = [
  "paises, organizaciones, bloques involucrados",
  "africa oriental, sur de asia, america central",
  "nombre del hito (h2100)",
  "nombre del miembro de aile",
  "descripcion de la imagen que deberia acompanar",
  "borrador / en revision / aprobado / publicado",
  "justificacion breve"
];

async function main() {
  const [hitosEntry, countriesEntry] = await Promise.all([
    resolveHistoryEntryName("Hitos pasados en limpio.docx"),
    resolveHistoryEntryName("Fichas país.docx")
  ]);

  if (!hitosEntry || !countriesEntry) {
    throw new Error("No pude encontrar ambos documentos maestros dentro de HISTORIA.");
  }

  await fs.rm(publicHistoryDocsImagesRoot, { recursive: true, force: true });

  const [hitosSource, countriesSource] = await Promise.all([
    readDocxLines(path.join(historyRoot, hitosEntry), buildDocAssetDirectoryName(hitosEntry)),
    readDocxLines(path.join(historyRoot, countriesEntry), buildDocAssetDirectoryName(countriesEntry))
  ]);
  const hitosLines = hitosSource.lines;
  const countriesLines = countriesSource.lines;

  const eraChunks = splitEraChunks(hitosLines);
  const hitoDocuments = eraChunks
    .flatMap((eraChunk) => splitHitosFromEraChunk(eraChunk))
    .map((document) => normalizeHitoSplitDocument(document));
  const countryDocuments = splitCountryChunks(countriesLines).map((document) =>
    normalizeCountrySplitDocument(document)
  );

  const audit = buildAudit({
    hitosEntry,
    countriesEntry,
    hitosSource,
    countriesSource,
    eraChunks,
    hitoDocuments,
    countryDocuments
  });

  await writeOutput({ eraChunks, hitoDocuments, countryDocuments, audit });

  printSummary(audit);
}

async function writeOutput({ eraChunks, hitoDocuments, countryDocuments, audit }) {
  await fs.rm(outputRoot, { recursive: true, force: true });

  await Promise.all([
    fs.mkdir(path.join(outputRoot, "eras"), { recursive: true }),
    fs.mkdir(path.join(outputRoot, "hitos"), { recursive: true }),
    fs.mkdir(path.join(outputRoot, "paises"), { recursive: true })
  ]);

  for (const eraChunk of eraChunks) {
    const eraDirectory = path.join(outputRoot, "hitos", eraChunk.eraSlug);
    await fs.mkdir(eraDirectory, { recursive: true });

    const eraPath = path.join(outputRoot, "eras", `${eraChunk.eraSlug}.md`);
    await fs.writeFile(eraPath, eraChunk.lines.join("\n"), "utf8");
  }

  for (const document of hitoDocuments) {
    const filePath = path.join(outputRoot, "hitos", document.eraSlug, document.fileName);
    await fs.writeFile(filePath, document.lines.join("\n"), "utf8");
  }

  for (const document of countryDocuments) {
    const filePath = path.join(outputRoot, "paises", document.fileName);
    await fs.writeFile(filePath, document.lines.join("\n"), "utf8");
  }

  await fs.writeFile(
    path.join(outputRoot, "audit-report.json"),
    JSON.stringify(audit, null, 2),
    "utf8"
  );
  await fs.writeFile(path.join(outputRoot, "README.md"), buildReadme(audit), "utf8");
}

function buildReadme(audit) {
  const nextSteps = [];

  if (
    audit.summary.hitosMissingRealId === 0 &&
    audit.summary.countriesWithNonPaddedHitoReferences === 0 &&
    audit.summary.countriesWithWeirdTrendMarkers === 0
  ) {
    nextSteps.push("1. La normalización mecánica ya quedó aplicada en los archivos separados.");
    nextSteps.push("2. Revisar únicamente los documentos marcados con issues en `audit-report.json`.");
    nextSteps.push("3. Probar primero el piloto en `/admin/import` y después correr el lote completo.");
  } else {
    nextSteps.push("1. Corregir primero los IDs de hitos y las referencias `H-0XX`.");
    nextSteps.push("2. Revisar los documentos marcados con issues en `audit-report.json`.");
    nextSteps.push("3. Recién después volver a probar la importación.");
  }

  const lines = [
    "# Split de HISTORIA",
    "",
    `Generado: ${audit.generatedAt}`,
    "",
    "## Salida",
    "",
    `- Eras: ${audit.summary.eras}`,
    `- Hitos: ${audit.summary.hitos}`,
    `- Países: ${audit.summary.countries}`,
    "",
    "## Hallazgos principales",
    "",
    `- Hitos con ID faltante o de ejemplo: ${audit.summary.hitosMissingRealId}`,
    `- Países con referencias de hito no normalizadas: ${audit.summary.countriesWithNonPaddedHitoReferences}`,
    `- Países con tendencias no estándar: ${audit.summary.countriesWithWeirdTrendMarkers}`,
    `- Imágenes extraídas desde DOCX: ${audit.summary.extractedImages}`,
    "",
    "## Archivos",
    "",
    "- `eras/`: un archivo por era completa",
    "- `hitos/<era-slug>/`: un archivo por hito",
    "- `paises/`: un archivo por país o región",
    "- `audit-report.json`: reporte completo por documento",
    "- `public/images/history-docs/`: imágenes extraídas del DOCX y referenciadas desde los `.md`",
    "",
    "## Próximo uso recomendado",
    "",
    ...nextSteps,
    ""
  ];

  return lines.join("\n");
}

async function readDocxLines(filePath, assetDirectoryName) {
  const targetDirectory = path.join(publicHistoryDocsImagesRoot, assetDirectoryName);
  await fs.mkdir(targetDirectory, { recursive: true });

  let extractedImages = 0;
  const result = await mammoth.convertToMarkdown(
    { path: filePath },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        extractedImages += 1;

        const extension = extensionForContentType(image.contentType);
        const fileName = `${padNumber(extractedImages)}${extension}`;
        const filePath = path.join(targetDirectory, fileName);
        const buffer = await image.readAsBuffer();

        await fs.writeFile(filePath, buffer);

        return {
          src: `${publicHistoryDocsImagesBasePath}/${assetDirectoryName}/${fileName}`
        };
      })
    }
  );

  return {
    lines: markdownToImportLines(result.value),
    extractedImages,
    assetDirectoryName,
    publicDirectory: `${publicHistoryDocsImagesBasePath}/${assetDirectoryName}`,
    messages: result.messages ?? []
  };
}

function markdownToImportLines(markdown) {
  return markdown
    .replace(/\r/g, "")
    .split("\n")
    .map(normalizeMarkdownLine)
    .filter(Boolean);
}

function normalizeMarkdownLine(line) {
  let nextLine = line.replace(/\u00a0/g, " ").trim();

  if (!nextLine) {
    return "";
  }

  nextLine = nextLine.replace(/<a [^>]*><\/a>/gi, "");
  nextLine = unescapeMarkdownText(nextLine);
  nextLine = nextLine.replace(/^#{1,6}\s+/, "");

  if (isMarkdownImageLine(nextLine)) {
    return nextLine;
  }

  nextLine = stripMarkdownEmphasis(nextLine);
  nextLine = nextLine.replace(/^>\s+/, "");
  nextLine = stripMarkdownEmphasis(nextLine);

  return nextLine.replace(/[ \t]+/g, " ").trim();
}

function stripMarkdownEmphasis(value) {
  let nextValue = value;

  while (/^(\*\*|__)(.*)\1$/.test(nextValue) || /^\*(.*)\*$/.test(nextValue) || /^_(.*)_$/.test(nextValue)) {
    nextValue = nextValue
      .replace(/^(\*\*|__)(.*)\1$/, "$2")
      .replace(/^\*(.*)\*$/, "$1")
      .replace(/^_(.*)_$/, "$1")
      .trim();
  }

  return nextValue
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .trim();
}

function unescapeMarkdownText(value) {
  return value.replace(/\\([\\`*_{}\[\]()#+\-.!>])/g, "$1");
}

function isMarkdownImageLine(line) {
  return /^!\[[^\]]*]\([^)]+\)$/.test(line);
}

function buildDocAssetDirectoryName(fileName) {
  return slugify(stripExtension(fileName));
}

function extensionForContentType(contentType) {
  const extensionsByType = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg"
  };

  return extensionsByType[contentType] ?? ".bin";
}

function splitEraChunks(lines) {
  const chunks = [];
  let current;

  lines.forEach((line, index) => {
    if (isEraHeadingLine(lines, index)) {
      if (current?.lines.length) {
        chunks.push(finalizeEraChunk(current));
      }

      current = { eraHeading: line, lines: [line] };
      return;
    }

    if (current) {
      current.lines.push(line);
    }
  });

  if (current?.lines.length) {
    chunks.push(finalizeEraChunk(current));
  }

  return chunks;
}

function finalizeEraChunk(chunk) {
  const eraNumber = Number(chunk.eraHeading.match(/ERA\s+(\d+)/i)?.[1] ?? 0);
  return {
    ...chunk,
    eraNumber,
    eraSlug: `era-${eraNumber}`
  };
}

function splitHitosFromEraChunk(eraChunk) {
  const hitos = [];
  const startIndexes = eraChunk.lines
    .map((_, index) => index)
    .filter((index) => isMasterHitoStart(eraChunk.lines, index));

  const prefix = startIndexes.length > 0 ? eraChunk.lines.slice(0, startIndexes[0]) : eraChunk.lines.slice(0, 1);

  startIndexes.forEach((startIndex, arrayIndex) => {
    const endIndex = startIndexes[arrayIndex + 1] ?? eraChunk.lines.length;
    const bodyLines = eraChunk.lines.slice(startIndex, endIndex);
    const marker = bodyLines[0];
    const hitoNumber = Number(marker.match(/Hito\s+(\d+)/i)?.[1] ?? arrayIndex + 1);
    const allLines = [...prefix, ...bodyLines];
    const title = getFirstValueAfterLabel(allLines, "Nombre del Hito", [
      ...HITO_FIELD_LABELS,
      ...HITO_SECTION_LABELS
    ]) ?? marker;
    const hitoId = getFirstValueAfterLabel(allLines, "ID del Hito", [
      ...HITO_FIELD_LABELS,
      ...HITO_SECTION_LABELS
    ]);

    hitos.push({
      kind: "hito",
      eraSlug: eraChunk.eraSlug,
      eraHeading: eraChunk.eraHeading,
      hitoNumber,
      marker,
      title,
      hitoId,
      lines: allLines,
      fileName: `${padNumber(hitoNumber)}-${slugify(title || marker || `hito-${hitoNumber}`)}.md`
    });
  });

  return hitos;
}

function splitCountryChunks(lines) {
  const startIndexes = lines
    .map((_, index) => index)
    .filter((index) => isCountryStart(lines, index));

  return startIndexes.map((startIndex, arrayIndex) => {
    const endIndex = startIndexes[arrayIndex + 1] ?? lines.length;
    const chunkLines = lines.slice(startIndex, endIndex);
    const displayName = chunkLines[0];
    const name = getFirstValueAfterLabel(chunkLines, "País / Región", [
      ...COUNTRY_FIELD_LABELS,
      ...COUNTRY_SECTION_LABELS
    ]) ?? displayName;

    return {
      kind: "country",
      index: arrayIndex + 1,
      displayName,
      name,
      lines: chunkLines,
      fileName: `${padNumber(arrayIndex + 1)}-${slugify(name || displayName || `pais-${arrayIndex + 1}`)}.md`
    };
  });
}

function normalizeHitoSplitDocument(document) {
  let nextLines = normalizeHitoReferencesInLines(document.lines);
  const normalizedId = formatHitoId(document.hitoNumber);
  const eraNumber = Number(document.eraSlug.match(/(\d+)$/)?.[1] ?? 0);

  nextLines = replaceValueAfterLabel(
    nextLines,
    "ID del Hito",
    `[${normalizedId}]`,
    [...HITO_FIELD_LABELS, ...HITO_SECTION_LABELS]
  );
  nextLines = replaceValueAfterLabel(
    nextLines,
    "Era / Contexto",
    eraNumber > 0 ? `[Era ${eraNumber}]` : `[${document.eraHeading}]`,
    [...HITO_FIELD_LABELS, ...HITO_SECTION_LABELS]
  );

  return {
    ...document,
    hitoId: normalizedId,
    lines: nextLines
  };
}

function normalizeCountrySplitDocument(document) {
  const normalizedReferences = normalizeHitoReferencesInLines(document.lines);
  const normalizedTrends = normalizeCountryTrendMarkers(normalizedReferences);

  return {
    ...document,
    lines: normalizedTrends
  };
}

function buildAudit({
  hitosEntry,
  countriesEntry,
  hitosSource,
  countriesSource,
  eraChunks,
  hitoDocuments,
  countryDocuments
}) {
  const hitoEntries = hitoDocuments.map((document) => auditHitoDocument(document));
  const countryEntries = countryDocuments.map((document) => auditCountryDocument(document));
  const allEntries = [...hitoEntries, ...countryEntries];
  const issueCounts = countIssues(allEntries);

  return {
    generatedAt: new Date().toISOString(),
    sources: {
      hitos: hitosEntry,
      countries: countriesEntry,
      images: {
        hitos: {
          directory: hitosSource.publicDirectory,
          count: hitosSource.extractedImages
        },
        countries: {
          directory: countriesSource.publicDirectory,
          count: countriesSource.extractedImages
        }
      }
    },
    summary: {
      eras: eraChunks.length,
      hitos: hitoDocuments.length,
      countries: countryDocuments.length,
      documentsWithIssues: allEntries.filter((entry) => entry.issues.length > 0).length,
      totalIssues: Object.values(issueCounts.byCode).reduce((accumulator, value) => accumulator + value, 0),
      extractedImages: hitosSource.extractedImages + countriesSource.extractedImages,
      hitosMissingRealId: hitoEntries.filter((entry) =>
        entry.issues.some((issue) => issue.code === "placeholder_hito_id" || issue.code === "missing_hito_id")
      ).length,
      countriesWithNonPaddedHitoReferences: countryEntries.filter((entry) =>
        entry.issues.some((issue) => issue.code === "non_padded_hito_reference")
      ).length,
      countriesWithWeirdTrendMarkers: countryEntries.filter((entry) =>
        entry.issues.some((issue) => issue.code === "non_standard_trend_marker")
      ).length
    },
    issueCounts,
    documents: {
      hitos: hitoEntries,
      countries: countryEntries
    }
  };
}

function auditHitoDocument(document) {
  const issues = [];
  const stopLabels = [...HITO_FIELD_LABELS, ...HITO_SECTION_LABELS];
  const title = getFirstValueAfterLabel(document.lines, "Nombre del Hito", stopLabels);
  const hitoId = getFirstValueAfterLabel(document.lines, "ID del Hito", stopLabels);
  const sourceType = getFirstValueAfterLabel(document.lines, "Tipo", stopLabels);
  const location = getFirstValueAfterLabel(document.lines, "Ubicación / Alcance", stopLabels);
  const actors = getFirstValueAfterLabel(document.lines, "Actores principales", stopLabels);

  if (!title) {
    issues.push(makeIssue("missing_title", "warning", "No encontré 'Nombre del Hito'."));
  }

  if (!hitoId) {
    issues.push(makeIssue("missing_hito_id", "warning", "No encontré 'ID del Hito'."));
  } else if (isExamplePlaceholder(hitoId)) {
    issues.push(makeIssue("placeholder_hito_id", "warning", "El ID del hito sigue en formato de ejemplo."));
  } else if (!/^H-\d{3}$/i.test(normalizeCapturedLine(hitoId))) {
    issues.push(makeIssue("invalid_hito_id_format", "warning", "El ID del hito no sigue el formato H-001."));
  }

  for (const [label, value] of [
    ["Tipo", sourceType],
    ["Ubicación / Alcance", location],
    ["Actores principales", actors]
  ]) {
    if (!value) {
      issues.push(makeIssue(`missing_${slugify(label)}`, "warning", `No encontré '${label}'.`));
      continue;
    }

    if (looksLikePlaceholderValue(value)) {
      issues.push(makeIssue(`placeholder_${slugify(label)}`, "warning", `El campo '${label}' parece seguir en modo plantilla.`));
    }
  }

  return {
    kind: "hito",
    fileName: document.fileName,
    eraSlug: document.eraSlug,
    title: title ?? document.title,
    hitoId: normalizeCapturedLine(hitoId ?? ""),
    issues
  };
}

function auditCountryDocument(document) {
  const issues = [];
  const stopLabels = [...COUNTRY_FIELD_LABELS, ...COUNTRY_SECTION_LABELS];
  const hitoReference = getFirstValueAfterLabel(document.lines, "Hito de referencia", stopLabels);
  const capital = getFirstValueAfterLabel(document.lines, "Capital", stopLabels);
  const period = getFirstValueAfterLabel(document.lines, "Período evaluado", stopLabels);
  const weirdTrends = extractNonStandardTrendMarkers(document.lines);

  if (!capital) {
    issues.push(makeIssue("missing_capital", "warning", "No encontré 'Capital'."));
  }

  if (!period) {
    issues.push(makeIssue("missing_period", "warning", "No encontré 'Período evaluado'."));
  }

  if (!hitoReference) {
    issues.push(makeIssue("missing_hito_reference", "warning", "No encontré 'Hito de referencia'."));
  } else {
    const matches = [...normalizeCapturedLine(hitoReference).matchAll(/H-(\d+)/gi)];

    if (matches.length === 0) {
      issues.push(makeIssue("invalid_hito_reference", "warning", "La referencia de hitos no contiene IDs detectables."));
    }

    if (matches.some((match) => match[1].length !== 3)) {
      issues.push(
        makeIssue(
          "non_padded_hito_reference",
          "warning",
          "Hay referencias de hitos sin padding de tres dígitos, por ejemplo H-30 en lugar de H-030."
        )
      );
    }
  }

  for (const marker of weirdTrends) {
    issues.push(
      makeIssue(
        "non_standard_trend_marker",
        "warning",
        `Se detectó un marcador de tendencia no estándar: ${marker}.`
      )
    );
  }

  return {
    kind: "country",
    fileName: document.fileName,
    name: document.name,
    displayName: document.displayName,
    issues
  };
}

function countIssues(entries) {
  const byLevel = {};
  const byCode = {};

  for (const entry of entries) {
    for (const issue of entry.issues) {
      byLevel[issue.level] = (byLevel[issue.level] ?? 0) + 1;
      byCode[issue.code] = (byCode[issue.code] ?? 0) + 1;
    }
  }

  return { byLevel, byCode };
}

function makeIssue(code, level, message) {
  return { code, level, message };
}

function extractNonStandardTrendMarkers(lines) {
  return [...new Set(
    lines.filter((line) => /^\[[↑↓↔]+]$/.test(line) && !/^\[(↑|↓|↔)]$/.test(line))
  )];
}

function normalizeCountryTrendMarkers(lines) {
  const nextLines = [...lines];

  for (let index = 0; index < nextLines.length; index += 1) {
    const line = nextLines[index];

    if (!/^\[[↑↓↔]{2,}\]$/.test(line)) {
      continue;
    }

    const originalMarker = line.slice(1, -1);
    nextLines[index] = "[↔]";

    const nextLine = nextLines[index + 1];
    if (nextLine && !isStructuralCountryLine(nextLine) && !nextLine.includes("Tendencia original en fuente:")) {
      nextLines[index + 1] = `${nextLine} (Tendencia original en fuente: ${originalMarker})`;
      continue;
    }

    nextLines.splice(index + 1, 0, `Tendencia original en fuente: ${originalMarker}`);
    index += 1;
  }

  return nextLines;
}

function isStructuralCountryLine(line) {
  const normalized = normalizeForSearch(normalizeCapturedLine(line));
  const labels = new Set([...COUNTRY_FIELD_LABELS, ...COUNTRY_SECTION_LABELS].map(normalizeForSearch));

  return labels.has(normalized) || /^era\s+([ivx]+|\d+)$/i.test(normalizeCapturedLine(line));
}

function normalizeHitoReferencesInLines(lines) {
  return lines.map((line) =>
    line.replace(/\bH-(\d{1,3})\b/gi, (_match, digits) => formatHitoId(digits))
  );
}

function replaceValueAfterLabel(lines, label, nextValue, stopLabels) {
  const labelKey = normalizeForSearch(label);
  const stopSet = new Set(stopLabels.map(normalizeForSearch));
  const nextLines = [...lines];
  const labelIndex = nextLines.findIndex((line) => normalizeForSearch(line) === labelKey);

  if (labelIndex === -1) {
    return nextLines;
  }

  let valueIndex = -1;

  for (let index = labelIndex + 1; index < nextLines.length; index += 1) {
    if (stopSet.has(normalizeForSearch(nextLines[index]))) {
      break;
    }

    valueIndex = index;
    break;
  }

  if (valueIndex === -1) {
    nextLines.splice(labelIndex + 1, 0, nextValue);
    return nextLines;
  }

  nextLines[valueIndex] = nextValue;
  return nextLines;
}

function getFirstValueAfterLabel(lines, label, stopLabels) {
  const target = normalizeForSearch(label);
  const stopSet = new Set(stopLabels.map(normalizeForSearch));
  const labelIndex = lines.findIndex((line) => normalizeForSearch(line) === target);

  if (labelIndex === -1) {
    return undefined;
  }

  const values = [];

  for (let index = labelIndex + 1; index < lines.length; index += 1) {
    const candidate = lines[index];

    if (stopSet.has(normalizeForSearch(candidate))) {
      break;
    }

    values.push(candidate);
  }

  return values.length > 0 ? normalizeCapturedLine(values[0]) : undefined;
}

function looksLikePlaceholderValue(value) {
  const normalized = normalizeForSearch(normalizeCapturedLine(value));
  return normalized.startsWith("ej:") || KNOWN_PLACEHOLDERS.some((entry) => normalized.includes(entry));
}

function isExamplePlaceholder(value) {
  return normalizeForSearch(normalizeCapturedLine(value)).startsWith("ej:");
}

function normalizeCapturedLine(line) {
  const trimmed = line.trim();
  const match = trimmed.match(/^\[(.*)]$/);
  return (match ? match[1] : trimmed).trim();
}

function isMasterHitoStart(lines, index) {
  return /^Hito\s+\d+$/i.test(lines[index] ?? "") && normalizeForSearch(lines[index + 1] ?? "") === normalizeForSearch("Nombre del Hito");
}

function isCountryStart(lines, index) {
  return normalizeForSearch(lines[index + 1] ?? "") === normalizeForSearch("País / Región");
}

function isEraHeadingLine(lines, index) {
  const line = lines[index] ?? "";

  if (!/^ERA\s+\d+$/i.test(line)) {
    return false;
  }

  const previousLine = normalizeForSearch(lines[index - 1] ?? "");
  const nextLine = normalizeForSearch(lines[index + 1] ?? "");

  if (previousLine === normalizeForSearch("Era / Contexto")) {
    return false;
  }

  if (nextLine === normalizeForSearch("1. ANTECEDENTES")) {
    return false;
  }

  return true;
}

async function resolveHistoryEntryName(expectedName) {
  const entries = await fs.readdir(historyRoot, { withFileTypes: true });
  const expectedKey = slugify(expectedName);
  return entries.find((entry) => slugify(entry.name) === expectedKey)?.name;
}

function padNumber(value) {
  return String(value).padStart(3, "0");
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeForSearch(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function stripExtension(value) {
  return value.replace(/\.[^.]+$/, "");
}

function formatHitoId(value) {
  return `H-${String(value).padStart(3, "0")}`;
}

function printSummary(audit) {
  console.log(`Split generado en ${outputRoot}`);
  console.log(`- Eras: ${audit.summary.eras}`);
  console.log(`- Hitos: ${audit.summary.hitos}`);
  console.log(`- Países: ${audit.summary.countries}`);
  console.log(`- Imágenes extraídas: ${audit.summary.extractedImages}`);
  console.log(`- Hitos con ID faltante/de ejemplo: ${audit.summary.hitosMissingRealId}`);
  console.log(
    `- Países con referencias de hito no normalizadas: ${audit.summary.countriesWithNonPaddedHitoReferences}`
  );
  console.log(
    `- Países con tendencias no estándar: ${audit.summary.countriesWithWeirdTrendMarkers}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
