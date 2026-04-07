import { findCanonicalCountry } from "@/lib/import/country-normalization";
import { getHistoryCountryMapPublicPath } from "@/lib/import/history-assets";
import { normalizeImportedMarkdown } from "@/lib/markdown";
import { normalizeForSearch, slugify, truncate } from "@/lib/utils";
import type {
  CountryDraftCandidate,
  CountryImportPreview,
  CountryScoreDraft,
  HitoDraftCandidate,
  HitoImportPreview,
  ImportIssue,
  ImportPreviewResult
} from "@/types/import";
import type { ArticleType, CountryScore, InfoboxData } from "@/types/wiki";

type BlockSpec = {
  key: string;
  label: string;
};

type MasterImportChunk = {
  marker: string;
  lines: string[];
};

type CountryNarrativeSection = {
  heading: string;
  depth: 2 | 3;
  lines: string[];
};

type CountryNarrativeParseResult = {
  markdown: string;
  extractedNarrative: Record<string, string>;
  summary?: string;
  firstBody?: string;
};

const HITO_FIELDS: BlockSpec[] = [
  { key: "title", label: "Nombre del Hito" },
  { key: "hitoId", label: "ID del Hito" },
  { key: "period", label: "Período" },
  { key: "sourceType", label: "Tipo" },
  { key: "location", label: "Ubicación / Alcance" },
  { key: "actors", label: "Actores principales" },
  { key: "eraContext", label: "Era / Contexto" },
  { key: "title", label: "Título del artículo wiki" }
];

const HITO_SECTIONS: BlockSpec[] = [
  { key: "antecedentes", label: "1. ANTECEDENTES" },
  { key: "desarrollo", label: "2. DESARROLLO" },
  { key: "consecuenciasInmediatas", label: "3. CONSECUENCIAS INMEDIATAS" },
  { key: "consecuenciasLargoPlazo", label: "4. CONSECUENCIAS A LARGO PLAZO" },
  { key: "paisesAfectados", label: "5. PAÍSES / REGIONES AFECTADOS" },
  { key: "datosClave", label: "6. DATOS CLAVE PARA LA WIKI" },
  { key: "conexiones", label: "7. CONEXIONES CON OTROS HITOS" }
];

const HITO_METADATA: BlockSpec[] = [
  { key: "metadata", label: "Metadatos para la Wiki" },
  { key: "titleMeta", label: "Título del artículo wiki" },
  { key: "categoriesMeta", label: "Categorías wiki" },
  { key: "infoboxMeta", label: "Infobox a usar" },
  { key: "imageMeta", label: "Imagen sugerida" },
  { key: "authorMeta", label: "Autor / Responsable" },
  { key: "statusMeta", label: "Estado" }
];

const COUNTRY_FIELDS: BlockSpec[] = [
  { key: "name", label: "País / Región" },
  { key: "bloc", label: "Bloque (2100)" },
  { key: "bloc", label: "Bloque (2085)" },
  { key: "capital", label: "Capital" },
  { key: "territory", label: "Extensión Km2" },
  { key: "population", label: "Población" },
  { key: "representative", label: "Representante" },
  { key: "map", label: "Mapa" },
  { key: "hitoReference", label: "Hito de referencia" },
  { key: "period", label: "Período evaluado" }
];

const COUNTRY_VARIABLES: BlockSpec[] = [
  { key: "climateExposure", label: "1. Exposición climática" },
  { key: "stateCapacity", label: "2. Capacidad estatal" },
  { key: "powerResources", label: "3. Recursos de poder" },
  { key: "techDependency", label: "4. Dependencia tech externa" },
  { key: "demographicPressure", label: "5. Presión demográfica/migratoria" },
  { key: "socialCohesion", label: "6. Cohesión social y narrativa" },
  { key: "economicVulnerability", label: "7. Vulnerabilidad económica/deuda" }
];

const COUNTRY_HISTORICAL_VARIABLES: BlockSpec[] = [
  { key: "climateExposure", label: "1. Exposición climática" },
  { key: "stateCapacity", label: "2. Capacidad estatal" },
  { key: "powerResources", label: "3. Recursos de poder" },
  { key: "techDependency", label: "4. Dependencia tech externa" },
  { key: "techDependency", label: "4. Dep. tech externa" },
  { key: "demographicPressure", label: "5. Presión demográfica/migratoria" },
  { key: "demographicPressure", label: "5. Presión demográfica" },
  { key: "socialCohesion", label: "6. Cohesión social y narrativa" },
  { key: "socialCohesion", label: "6. Cohesión social" },
  { key: "economicVulnerability", label: "7. Vulnerabilidad económica/deuda" },
  { key: "economicVulnerability", label: "7. Vuln. económica" }
];

const COUNTRY_PROFILE_STARTS: BlockSpec[] = [
  { key: "profile", label: "Perfil Narrativo del País" },
  { key: "profile", label: "Perfil Narrativo de la organización" }
];

const COUNTRY_PROFILE_ENDS: BlockSpec[] = [
  { key: "historial", label: "Historial de Puntajes por Era (opcional)" }
];

const TEMPLATE_HEADINGS = new Set(
  [
    "FICHA DE HITO",
    "FICHA DE PAÍS / REGIÓN",
    "FICHA DE HITO — EJEMPLO",
    "Fichas de Hitos + Fichas de País",
    "Perfil Narrativo del País",
    "Perfil Narrativo de la organización",
    "Variables del Mundo (puntuar 1 a 5)",
    "PUNTAJE TOTAL",
    "Historial de Puntajes por Era (opcional)",
    "Metadatos para la Wiki"
  ].map(normalizeForSearch)
);

const narrativeBulletHeadings = new Set(
  [
    "events",
    "proposal-support",
    "proposal-demands",
    "proposal-fears",
    "alignment",
    "role",
    "active-conflicts",
    "relationship-type",
    "relationship-features",
    "relationship-tensions",
    "relationship-cooperation",
    "relationship-culture",
    "relationship-aether-view",
    "relationship-practice"
  ]
);

export function parseCeaDocumentText(rawText: string, fileName: string): ImportPreviewResult {
  const normalizedLines = toLines(rawText);
  const rawTextPreview = truncate(normalizedLines.join("\n"), 4000);

  if (looksLikeMasterTemplate(normalizedLines)) {
    return {
      kind: "unknown",
      fileName,
      templateName: "Plantilla general CEA",
      rawTextPreview,
      normalizedLines,
      issues: [
        {
          level: "warning",
          message:
            "El documento parece ser la plantilla general del CEA, no una ficha individual lista para importar."
        }
      ]
    };
  }

  if (looksLikeMasterHitosDocument(normalizedLines)) {
    return {
      kind: "unknown",
      fileName,
      templateName: "Documento maestro de hitos",
      rawTextPreview,
      normalizedLines,
      issues: [
        {
          level: "warning",
          message:
            "Este archivo contiene varios hitos concatenados. Usa la importación desde la carpeta HISTORIA para separarlos en previews individuales."
        }
      ]
    };
  }

  if (looksLikeMasterCountriesDocument(normalizedLines)) {
    return {
      kind: "unknown",
      fileName,
      templateName: "Documento maestro de países",
      rawTextPreview,
      normalizedLines,
      issues: [
        {
          level: "warning",
          message:
            "Este archivo contiene varias fichas de país concatenadas. Usa la importación desde la carpeta HISTORIA para separarlas en previews individuales."
        }
      ]
    };
  }

  const hitoSignals = scoreSignals(normalizedLines, [...HITO_FIELDS, ...HITO_SECTIONS]);
  const countrySignals = scoreSignals(normalizedLines, [...COUNTRY_FIELDS, ...COUNTRY_VARIABLES]);

  if (hitoSignals >= 5 && hitoSignals >= countrySignals) {
    return parseHitoDocument(normalizedLines, fileName, rawTextPreview);
  }

  if (countrySignals >= 5) {
    return parseCountryDocument(normalizedLines, fileName, rawTextPreview);
  }

  return {
    kind: "unknown",
    fileName,
    templateName: "No reconocido",
    rawTextPreview,
    normalizedLines,
    issues: [
      {
        level: "error",
        message:
          "No pude reconocer la ficha como Hito ni como País/Región con la estructura esperada del CEA."
      }
    ]
  };
}

export function parseMasterHitosDocumentText(rawText: string, fileName: string): HitoImportPreview[] {
  return splitMasterHitoLines(toLines(rawText)).map((chunk) => {
    const preview = parseHitoDocument(
      chunk.lines,
      buildMasterPreviewName(fileName, chunk.marker),
      truncate(chunk.lines.join("\n"), 4000)
    );

    preview.fileName = buildMasterPreviewName(fileName, preview.draft.hitoId ?? chunk.marker, preview.draft.title);
    return preview;
  });
}

export function parseMasterCountriesDocumentText(rawText: string, fileName: string): CountryImportPreview[] {
  return splitMasterCountryLines(toLines(rawText)).map((chunk) => {
    const preview = parseCountryDocument(
      chunk.lines,
      buildMasterPreviewName(fileName, chunk.marker),
      truncate(chunk.lines.join("\n"), 4000)
    );

    preview.fileName = buildMasterPreviewName(fileName, preview.draft.name, preview.draft.slug);
    return preview;
  });
}

function parseHitoDocument(
  lines: string[],
  fileName: string,
  rawTextPreview: string
): HitoImportPreview {
  const issues: ImportIssue[] = [];
  const fieldBlocks = collectBlocks(lines, HITO_FIELDS, [...HITO_SECTIONS, ...HITO_METADATA, ...COUNTRY_FIELDS]);
  const sectionBlocks = collectBlocks(lines, HITO_SECTIONS, [...HITO_METADATA, ...COUNTRY_FIELDS]);
  const metadataBlocks = collectBlocks(lines, HITO_METADATA, [...COUNTRY_FIELDS]);

  const title = firstValue(fieldBlocks.title) ?? stripExtension(fileName);
  const period = firstValue(fieldBlocks.period);
  const sourceType = firstValue(fieldBlocks.sourceType);
  const location = firstValue(fieldBlocks.location);
  const actors = firstValue(fieldBlocks.actors);
  const eraContext = firstValue(fieldBlocks.eraContext);
  const hitoId = normalizeHitoId(firstValue(fieldBlocks.hitoId));
  const eraSlug = parseEraSlug(eraContext ?? period) ?? parseEraSlug(lines.join("\n"));
  const articleType = normalizeArticleType(sourceType);
  const imageUrl = extractMarkdownImageSource(metadataBlocks.imageMeta);
  const yearsFromPeriod = deriveYears(period ?? "");
  const years =
    yearsFromPeriod.yearStart || yearsFromPeriod.yearEnd
      ? yearsFromPeriod
      : deriveYears(lines.join("\n"));
  const conexiones = sectionBlocks.conexiones ?? [];
  const connectionHints = extractHitoIds(conexiones.join(" "));
  const summary = buildHitoSummary({
    title,
    sourceType,
    location,
    actors,
    period,
    sections: sectionBlocks
  });

  if (!fieldBlocks.title?.length) {
    issues.push({
      level: "warning",
      field: "title",
      message: "No encontré un título explícito para el hito. Se usó el nombre del archivo como fallback."
    });
  }

  if (!sourceType) {
    issues.push({
      level: "warning",
      field: "sourceType",
      message: "No encontré el campo 'Tipo'. Se normalizó como 'event' por defecto."
    });
  }

  if (!eraSlug) {
    issues.push({
      level: "warning",
      field: "eraContext",
      message: "No pude derivar la era desde 'Era / Contexto' o 'Período'."
    });
  }

  if (!summary) {
    issues.push({
      level: "error",
      field: "summary",
      message:
        "La ficha no trae contenido suficiente en sus secciones narrativas para generar un resumen."
    });
  }

  if (connectionHints.length > 0) {
    issues.push({
      level: "info",
      field: "conexiones",
      message:
        "Se detectaron conexiones por ID de hito. La resolución automática a slugs de artículos queda pendiente para la integración con base real."
    });
  }

  const draft: HitoDraftCandidate = {
    title,
    slug: slugify(title),
    type: articleType,
    summary: summary || `Borrador importado desde ${fileName}.`,
    eraSlug,
    hitoId,
    yearStart: years.yearStart,
    yearEnd: years.yearEnd,
    categorySlugs: categoriesForArticleType(articleType),
    infobox: createHitoInfobox({
      articleType,
      actors,
      location,
      sourceType,
      yearStart: years.yearStart,
      yearEnd: years.yearEnd
    }),
    imageUrl,
    markdown: buildHitoMarkdown(sectionBlocks),
    sourceFields: {
      sourceType,
      location,
      actors,
      eraContext,
      connectionHints
    }
  };

  return {
    kind: "hito",
    fileName,
    templateName: "Ficha de Hito CEA",
    rawTextPreview,
    normalizedLines: lines,
    issues,
    draft,
    extractedFields: simplifyBlocks(fieldBlocks),
    extractedSections: sectionBlocks
  };
}

function parseCountryDocument(
  lines: string[],
  fileName: string,
  rawTextPreview: string
): CountryImportPreview {
  const issues: ImportIssue[] = [];
  const fieldBlocks = collectBlocks(lines, COUNTRY_FIELDS, [
    { key: "variables", label: "Variables del Mundo (puntuar 1 a 5)" },
    { key: "puntaje", label: "PUNTAJE TOTAL" },
    ...COUNTRY_PROFILE_STARTS,
    ...COUNTRY_PROFILE_ENDS
  ]);
  const currentVariableLines = sliceBetweenLabelText(
    lines,
    "Variables del Mundo (puntuar 1 a 5)",
    "PUNTAJE TOTAL"
  );
  const variableBlocks = collectBlocks(currentVariableLines, COUNTRY_VARIABLES);
  const narrativeLines = sliceBetweenLabels(lines, COUNTRY_PROFILE_STARTS, COUNTRY_PROFILE_ENDS);
  const narrative = parseCountryNarrative(narrativeLines);

  const rawName = firstValue(fieldBlocks.name) ?? lines[0] ?? stripExtension(fileName);
  const canonical = findCanonicalCountry(rawName) ?? findCanonicalCountry(lines[0] ?? "");
  const name = canonical?.name ?? rawName;
  const currentEraSlug = parseEraSlug(firstValue(fieldBlocks.period));
  const scores = COUNTRY_VARIABLES.map((spec) =>
    parseCountryVariable(spec.label, variableBlocks[spec.key] ?? [])
  );
  const historicalScores = parseCountryHistoricalScores(lines, currentEraSlug);
  const representativeImageUrl = extractMarkdownImageSource(fieldBlocks.representative);
  const embeddedMapUrl = extractMarkdownImageSource(fieldBlocks.map);
  const profileMarkdown = [buildCountryBaseMarkdown(fieldBlocks), narrative.markdown].filter(Boolean).join("\n\n");
  const summary = truncate(
    narrative.summary ?? narrative.firstBody ?? firstValue(fieldBlocks.capital) ?? "",
    220
  );

  if (!fieldBlocks.name?.length) {
    issues.push({
      level: "warning",
      field: "name",
      message: "No encontré 'País / Región'. Se usó el nombre del bloque como fallback."
    });
  }

  if (!canonical) {
    issues.push({
      level: "warning",
      field: "name",
      message:
        "No encontré este país en la capa canónica. Se importará con slug derivado del texto y sin vínculo automático de mapa/órganos."
    });
  }

  if (!currentEraSlug) {
    issues.push({
      level: "warning",
      field: "period",
      message: "No pude derivar la era desde 'Período evaluado'."
    });
  }

  if (!summary) {
    issues.push({
      level: "warning",
      field: "generalSituation",
      message: "No se encontró contenido suficiente para generar el resumen del país."
    });
  }

  if (!profileMarkdown) {
    issues.push({
      level: "error",
      field: "profileMarkdown",
      message: "No pude construir el perfil narrativo editable para esta ficha."
    });
  }

  if (scores.every((score) => score.score === undefined) && historicalScores.length === 0) {
    issues.push({
      level: "warning",
      field: "scores",
      message:
        "No pude extraer puntajes utilizables de la tabla principal ni del historial por eras."
    });
  }

  const draft: CountryDraftCandidate = {
    name,
    slug: canonical?.slug ?? slugify(name),
    bloc: normalizeBloc(firstValue(fieldBlocks.bloc), canonical?.slug),
    hitoReference: normalizeHitoReference(firstValue(fieldBlocks.hitoReference)),
    eraSlug: currentEraSlug,
    summary: summary || `Perfil narrativo importado desde ${fileName}.`,
    profileMarkdown,
    flagUrl: representativeImageUrl,
    mapUrl:
      canonical?.sourceMapFileName
        ? getHistoryCountryMapPublicPath(canonical.slug, canonical.sourceMapFileName)
        : embeddedMapUrl,
    organMemberships: canonical?.organMemberships,
    scores,
    historicalScores
  };

  return {
    kind: "country",
    fileName,
    templateName: "Ficha de País/Región CEA",
    rawTextPreview,
    normalizedLines: lines,
    issues,
    draft,
    extractedFields: simplifyBlocks(fieldBlocks),
    extractedNarrative: narrative.extractedNarrative
  };
}

function toLines(rawText: string): string[] {
  return rawText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

function collectBlocks(
  lines: string[],
  specs: BlockSpec[],
  extraStops: BlockSpec[] = []
): Record<string, string[]> {
  const blocks: Record<string, string[]> = {};
  const specMap = new Map(specs.map((spec) => [normalizeBlockLabel(spec.label), spec]));
  const stopSet = new Set([
    ...specs.map((spec) => normalizeBlockLabel(spec.label)),
    ...extraStops.map((spec) => normalizeBlockLabel(spec.label)),
    ...[...TEMPLATE_HEADINGS].map(normalizeBlockLabel)
  ]);

  for (let index = 0; index < lines.length; index += 1) {
    const current = normalizeBlockLabel(lines[index]);
    const matched = specMap.get(current);

    if (!matched) {
      continue;
    }

    const values: string[] = [];

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = lines[cursor];

      if (stopSet.has(normalizeBlockLabel(candidate))) {
        break;
      }

      const normalizedCandidate = normalizeCapturedLine(candidate);

      if (!normalizedCandidate || isPlaceholderLine(normalizedCandidate)) {
        continue;
      }

      values.push(normalizedCandidate);
      index = cursor;
    }

    const existing = blocks[matched.key];
    if (!existing || existing.length === 0 || values.length > 0) {
      blocks[matched.key] = values;
    }
  }

  return blocks;
}

function simplifyBlocks(blocks: Record<string, string[]>): Record<string, string> {
  return Object.fromEntries(Object.entries(blocks).map(([key, value]) => [key, value.join(" ")]));
}

function firstValue(values?: string[]): string | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }

  return values.join(" ").trim() || undefined;
}

function firstTextValue(values?: string[]): string | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }

  const textOnly = values
    .map(normalizeCapturedLine)
    .filter(Boolean)
    .filter((line) => !isMarkdownImageLine(line));

  return textOnly.join(" ").trim() || undefined;
}

function sliceBetweenLabels(lines: string[], starts: BlockSpec[], ends: BlockSpec[]): string[] {
  const startSet = new Set(starts.map((spec) => normalizeBlockLabel(spec.label)));
  const endSet = new Set(ends.map((spec) => normalizeBlockLabel(spec.label)));
  const startIndex = lines.findIndex((line) => startSet.has(normalizeBlockLabel(line)));

  if (startIndex === -1) {
    return [];
  }

  const collected: string[] = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (endSet.has(normalizeBlockLabel(lines[index]))) {
      break;
    }

    collected.push(lines[index]);
  }

  return collected;
}

function sliceBetweenLabelText(lines: string[], startLabel: string, endLabel: string): string[] {
  const startKey = normalizeBlockLabel(startLabel);
  const endKey = normalizeBlockLabel(endLabel);
  const startIndex = lines.findIndex((line) => normalizeBlockLabel(line) === startKey);

  if (startIndex === -1) {
    return [];
  }

  const collected: string[] = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (normalizeBlockLabel(lines[index]) === endKey) {
      break;
    }

    collected.push(lines[index]);
  }

  return collected;
}

function buildHitoMarkdown(sections: Record<string, string[]>): string {
  return normalizeImportedMarkdown(
    [
    markdownSection("Contexto", sections.antecedentes ?? []),
    markdownSection("Desarrollo", sections.desarrollo ?? []),
    markdownSection("Consecuencias inmediatas", sections.consecuenciasInmediatas ?? []),
    markdownSection("Consecuencias a largo plazo", sections.consecuenciasLargoPlazo ?? []),
    markdownSection("Países y regiones afectados", sections.paisesAfectados ?? [], true),
    markdownSection("Datos clave para la wiki", sections.datosClave ?? [], true),
    markdownSection("Conexiones con otros hitos", sections.conexiones ?? [], true)
  ]
    .filter(Boolean)
    .join("\n\n")
  );
}

function buildHitoSummary(input: {
  title: string;
  sourceType?: string;
  location?: string;
  actors?: string;
  period?: string;
  sections: Record<string, string[]>;
}): string {
  const participants = summarizeActors(input.actors);
  const metadataSummary = truncate(
    [
      input.title ? `${input.title} ${describeHitoType(input.sourceType)}` : "",
      input.location ? `con alcance en ${stripTrailingPunctuation(input.location)}` : "",
      participants ? `e involucra a ${participants}` : "",
      input.period ? `durante ${stripTrailingPunctuation(input.period)}` : ""
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+\./g, ".")
      .trim()
      .replace(/\.*$/, "."),
    220
  );

  if (metadataSummary && metadataSummary !== ".") {
    return metadataSummary;
  }

  const candidateSections = [
    input.sections.antecedentes ?? [],
    input.sections.desarrollo ?? [],
    input.sections.consecuenciasInmediatas ?? [],
    input.sections.consecuenciasLargoPlazo ?? []
  ];

  for (const lines of candidateSections) {
    const summary = truncate(
      lines
        .map(normalizeCapturedLine)
        .filter(Boolean)
        .filter((line) => !isPlaceholderLine(line) && !isMarkdownImageLine(line))
        .join(" "),
      220
    );

    if (summary) {
      return summary;
    }
  }

  return "";
}

function summarizeActors(actors?: string) {
  if (!actors) {
    return undefined;
  }

  const parts = actors
    .split(",")
    .map((part) => stripTrailingPunctuation(part))
    .filter(Boolean);

  if (parts.length === 0) {
    return undefined;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return `${parts[0]} y ${parts[1]}`;
  }

  return `${parts[0]}, ${parts[1]} y otros actores`;
}

function describeHitoType(sourceType?: string) {
  const cleanSourceType = stripTrailingPunctuation(sourceType);

  if (!cleanSourceType) {
    return "es un hito";
  }

  return `es un hito de tipo ${cleanSourceType.toLowerCase()}`;
}

function stripTrailingPunctuation(value?: string) {
  return value?.trim().replace(/[.;,:!?]+$/g, "") ?? "";
}

function buildCountryBaseMarkdown(fieldBlocks: Record<string, string[]>): string {
  const baseFields = [
    ["Capital", firstTextValue(fieldBlocks.capital)],
    ["Representante", firstTextValue(fieldBlocks.representative)],
    ["Población", firstTextValue(fieldBlocks.population)],
    ["Extensión", firstTextValue(fieldBlocks.territory)],
    ["Hito de referencia", normalizeHitoReference(firstTextValue(fieldBlocks.hitoReference))]
  ].filter(([, value]) => Boolean(value));

  if (baseFields.length === 0) {
    return "";
  }

  return [
    "## Datos base",
    "",
    ...baseFields.map(([label, value]) => `- ${label}: ${value}`)
  ].join("\n");
}

function markdownSection(title: string, lines: string[], forceBullets = false): string {
  const normalizedLines = lines
    .map(normalizeCapturedLine)
    .filter(Boolean)
    .filter((line) => !isPlaceholderLine(line));

  if (normalizedLines.length === 0) {
    return "";
  }

  const body = forceBullets
    ? normalizedLines.map((line) => `- ${line}`).join("\n")
    : normalizedLines.join("\n\n");

  return `## ${title}\n\n${body}`;
}

function parseCountryNarrative(lines: string[]): CountryNarrativeParseResult {
  const sections: CountryNarrativeSection[] = [];
  let current: CountryNarrativeSection | undefined;

  for (const rawLine of lines) {
    const line = normalizeCapturedLine(rawLine);

    if (!line || isPlaceholderLine(line) || isCountryProfileTitle(line)) {
      continue;
    }

    if (isCountryNarrativeHeading(line)) {
      current = {
        heading: formatNarrativeHeading(line),
        depth: getNarrativeHeadingDepth(line),
        lines: []
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = {
        heading: "Panorama general",
        depth: 2,
        lines: []
      };
      sections.push(current);
    }

    current.lines.push(line);
  }

  const populatedSections = sections.filter((section) => section.lines.length > 0);
  const extractedNarrative = Object.fromEntries(
    populatedSections.map((section) => [narrativeHeadingKey(section.heading), section.lines.join(" ")])
  );
  const markdown = populatedSections.map(formatNarrativeSection).join("\n\n");
  const firstBody = populatedSections[0]?.lines.join(" ");

  return {
    markdown,
    extractedNarrative,
    summary: extractedNarrative.generalSituation ?? firstBody,
    firstBody
  };
}

function formatNarrativeSection(section: CountryNarrativeSection): string {
  const prefix = "#".repeat(section.depth);
  const headingKey = narrativeHeadingKey(section.heading);
  const body = narrativeBulletHeadings.has(headingKey)
    ? section.lines.map((line) => `- ${line.replace(/^[-•]\s*/, "")}`).join("\n")
    : section.lines.join("\n\n");

  return `${prefix} ${section.heading}\n\n${body}`;
}

function isCountryProfileTitle(line: string) {
  const normalized = normalizeBlockLabel(line);
  return COUNTRY_PROFILE_STARTS.some((spec) => normalizeBlockLabel(spec.label) === normalized);
}

function isCountryNarrativeHeading(line: string) {
  const normalized = normalizeForSearch(line);

  return (
    /^¿.+\?$/.test(line) ||
    /^relacion con /.test(normalized) ||
    /^(situacion general|posicion geopolitica|eventos clave que lo afectaron|posicion para la cumbre 2100)$/.test(
      normalized
    ) ||
    /^(tipo de relacion|caracteristicas del vinculo|tensiones principales|puntos de cooperacion|vinculos culturales \/ religiosos|aether, por su parte:|en la practica:|apoya:|exige:)$/.test(
      normalized
    )
  );
}

function getNarrativeHeadingDepth(line: string): 2 | 3 {
  const normalized = normalizeForSearch(line);

  return /^(situacion general|posicion geopolitica|eventos clave que lo afectaron|posicion para la cumbre 2100)$/.test(
    normalized
  ) || /^relacion con /.test(normalized)
    ? 2
    : 3;
}

function formatNarrativeHeading(line: string) {
  return line.replace(/:\s*$/, "").trim();
}

function narrativeHeadingKey(line: string) {
  const normalized = normalizeForSearch(line.replace(/:\s*$/, ""));

  if (normalized === "situacion general") {
    return "generalSituation";
  }

  if (normalized === "posicion geopolitica") {
    return "geopolitics";
  }

  if (normalized === "eventos clave que lo afectaron") {
    return "events";
  }

  if (normalized === "posicion para la cumbre 2100") {
    return "summitPosition";
  }

  if (normalized === "¿con quien se alinea?" || normalized === "con quien se alinea?") {
    return "alignment";
  }

  if (normalized === "¿que rol juega en su bloque?" || normalized === "que rol juega en su bloque?") {
    return "role";
  }

  if (normalized === "¿tiene conflictos activos?" || normalized === "tiene conflictos activos?") {
    return "active-conflicts";
  }

  if (normalized === "¿que propuesta apoya?" || normalized === "que propuesta apoya?") {
    return "proposal";
  }

  if (normalized === "apoya") {
    return "proposal-support";
  }

  if (normalized === "exige") {
    return "proposal-demands";
  }

  if (normalized === "¿que teme?" || normalized === "que teme?") {
    return "proposal-fears";
  }

  if (normalized === "tipo de relacion") {
    return "relationship-type";
  }

  if (normalized === "caracteristicas del vinculo") {
    return "relationship-features";
  }

  if (normalized === "tensiones principales") {
    return "relationship-tensions";
  }

  if (normalized === "puntos de cooperacion") {
    return "relationship-cooperation";
  }

  if (normalized === "vinculos culturales / religiosos") {
    return "relationship-culture";
  }

  if (normalized === "aether, por su parte") {
    return "relationship-aether-view";
  }

  if (normalized === "en la practica") {
    return "relationship-practice";
  }

  if (normalized.startsWith("relacion con aether")) {
    return "aether";
  }

  if (normalized.startsWith("relacion con la confederacion")) {
    return "confederation";
  }

  if (normalized.startsWith("relacion con los estados mixtos")) {
    return "mixedStates";
  }

  if (normalized.startsWith("relacion con ummah")) {
    return "ummah";
  }

  return slugify(line);
}

function normalizeArticleType(sourceType?: string): ArticleType {
  const normalized = normalizeForSearch(sourceType ?? "");

  if (/tratad|pacto|acuerdo/.test(normalized)) {
    return "treaty";
  }

  if (/conflicto|guerra|batalla|choque armado/.test(normalized)) {
    return "conflict";
  }

  if (/bloque|coalicion|confederacion/.test(normalized)) {
    return "bloc";
  }

  if (/organizacion|institucion|alianza|consorcio/.test(normalized)) {
    return "organization";
  }

  if (/tecnolog|infraestructura|protocolo|red|sistema/.test(normalized)) {
    return "technology";
  }

  if (/geografi|territorio|region/.test(normalized)) {
    return "geography";
  }

  if (/sociedad|cultural|movimiento social/.test(normalized)) {
    return "society";
  }

  if (/cumbre|summit/.test(normalized)) {
    return "summit";
  }

  return "event";
}

function categoriesForArticleType(type: ArticleType): string[] {
  switch (type) {
    case "treaty":
      return ["tratados"];
    case "bloc":
    case "organization":
      return ["bloques-y-actores"];
    case "technology":
      return ["tecnologia-y-control"];
    case "summit":
      return ["cumbre-2100", "bloques-y-actores"];
    default:
      return ["eventos-y-crisis"];
  }
}

function createHitoInfobox(input: {
  articleType: ArticleType;
  actors?: string;
  location?: string;
  sourceType?: string;
  yearStart?: number;
  yearEnd?: number;
}): InfoboxData {
  const dateLabel =
    input.yearStart && input.yearEnd
      ? input.yearStart === input.yearEnd
        ? String(input.yearStart)
        : `${input.yearStart} - ${input.yearEnd}`
      : undefined;

  switch (input.articleType) {
    case "treaty":
      return {
        type: "treaty",
        date: dateLabel,
        location: input.location,
        treaty_type: input.sourceType,
        signatories: input.actors
      };
    case "bloc":
      return {
        type: "bloc",
        founded: input.yearStart ? String(input.yearStart) : undefined,
        key_members: input.actors,
        location: input.location
      };
    case "organization":
      return {
        type: "organization",
        founded: input.yearStart ? String(input.yearStart) : undefined,
        headquarters: input.location,
        members: input.actors
      };
    case "technology":
      return {
        type: "technology",
        founded: input.yearStart ? String(input.yearStart) : undefined,
        location: input.location,
        consequences: input.sourceType
      };
    default:
      return {
        type: input.articleType,
        date: dateLabel,
        location: input.location,
        event_type: input.sourceType,
        related: []
      };
  }
}

function deriveYears(text: string): { yearStart?: number; yearEnd?: number } {
  const years = [...text.matchAll(/\b(20(?:2[0-9]|[3-9][0-9])|2100)\b/g)]
    .map((match) => Number(match[1]))
    .sort((left, right) => left - right);

  if (years.length === 0) {
    return {};
  }

  return {
    yearStart: years[0],
    yearEnd: years[years.length - 1]
  };
}

function parseEraSlug(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.trim();
  const numericMatch = normalizedValue.match(/Era\s+(\d+)/i);

  if (numericMatch) {
    return `era-${numericMatch[1]}`;
  }

  const romanMatch = normalizedValue.match(/Era\s+([IVX]+)/i);
  if (romanMatch) {
    const roman = romanMatch[1].toUpperCase();
    const map: Record<string, number> = {
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6
    };

    const eraNumber = map[roman];
    return eraNumber ? `era-${eraNumber}` : undefined;
  }

  const years = deriveYears(normalizedValue);
  const referenceYear = years.yearEnd ?? years.yearStart;

  if (!referenceYear) {
    return undefined;
  }

  if (referenceYear >= 2076) {
    return "era-4";
  }

  if (referenceYear >= 2051) {
    return "era-3";
  }

  if (referenceYear >= 2033) {
    return "era-2";
  }

  if (referenceYear >= 2026) {
    return "era-1";
  }

  return undefined;
}

function extractHitoIds(value: string): string[] {
  return [
    ...new Set(
      [...value.matchAll(/H-(\d{1,3})/gi)].map((match) => formatHitoId(match[1]))
    )
  ];
}

function parseCountryVariable(label: string, lines: string[]): CountryScoreDraft {
  const cleaned = lines
    .map(normalizeCapturedLine)
    .filter(Boolean)
    .filter((line) => !isPlaceholderLine(line) && !looksLikeDescription(line));
  const score = cleaned.map(parseNumericValue).find((value) => value !== undefined && value >= 1 && value <= 5);
  const trendLine = cleaned.find((line) => /^(↑|↓|↔|up|down|stable|[↑↓↔]{2,})$/i.test(line));
  const notes = cleaned
    .filter((line) => line !== trendLine)
    .filter((line) => parseNumericValue(line) === undefined)
    .join(" ")
    .trim();

  return {
    variable: label,
    score,
    trend: normalizeTrend(trendLine),
    notes: notes || undefined
  };
}

function parseCountryHistoricalScores(lines: string[], currentEraSlug?: string): CountryScore[] {
  const historyLines = sliceBetweenLabels(lines, COUNTRY_PROFILE_ENDS, []);

  if (historyLines.length === 0) {
    return [];
  }

  const eraOrder = historyLines
    .filter((line) => /^Era\s+([IVX]+|\d+)$/i.test(line))
    .map((line) => parseEraSlug(line))
    .filter((value): value is string => Boolean(value));

  if (eraOrder.length === 0) {
    return [];
  }

  const historyBlocks = collectBlocks(historyLines, COUNTRY_HISTORICAL_VARIABLES, [
    { key: "total", label: "TOTAL" }
  ]);
  const historicalMap = new Map<string, CountryScore>();

  for (const eraSlug of eraOrder) {
    historicalMap.set(eraSlug, { eraSlug });
  }

  for (const variable of COUNTRY_HISTORICAL_VARIABLES) {
    const values = (historyBlocks[variable.key] ?? [])
      .map(parseNumericValue)
      .map(normalizeCountryScoreValue)
      .filter((value): value is number => value !== undefined);

    values.slice(0, eraOrder.length).forEach((value, index) => {
      const draft = historicalMap.get(eraOrder[index]);
      if (draft) {
        assignHistoricalMetric(draft, variable.key, value);
      }
    });
  }

  return eraOrder
    .filter((eraSlug) => eraSlug !== currentEraSlug)
    .map((eraSlug) => historicalMap.get(eraSlug))
    .filter((score): score is CountryScore => Boolean(score))
    .filter(hasHistoricalScoreContent);
}

function assignHistoricalMetric(score: CountryScore, variableKey: string, value: number) {
  switch (variableKey) {
    case "climateExposure":
      score.climateExposure = value;
      return;
    case "stateCapacity":
      score.stateCapacity = value;
      return;
    case "powerResources":
      score.powerResources = value;
      return;
    case "techDependency":
      score.techDependency = value;
      return;
    case "demographicPressure":
      score.demographicPressure = value;
      return;
    case "socialCohesion":
      score.socialCohesion = value;
      return;
    default:
      score.economicVulnerability = value;
  }
}

function hasHistoricalScoreContent(score: CountryScore) {
  return [
    score.climateExposure,
    score.stateCapacity,
    score.powerResources,
    score.techDependency,
    score.demographicPressure,
    score.socialCohesion,
    score.economicVulnerability
  ].some((value) => (value ?? 0) > 0);
}

function parseNumericValue(value: string): number | undefined {
  const normalized = normalizeCapturedLine(value).replace(",", ".");

  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return undefined;
  }

  return Number(normalized);
}

function normalizeCountryScoreValue(value?: number): number | undefined {
  if (value === undefined || value < 1 || value > 5) {
    return undefined;
  }

  return value;
}

function normalizeTrend(value?: string): "up" | "down" | "stable" | undefined {
  if (!value) {
    return undefined;
  }

  if (/[↑↓↔]{2,}/.test(value)) {
    return "stable";
  }

  if (value === "↑" || /^up$/i.test(value)) {
    return "up";
  }

  if (value === "↓" || /^down$/i.test(value)) {
    return "down";
  }

  if (value === "↔" || /^stable$/i.test(value)) {
    return "stable";
  }

  return undefined;
}

function normalizeBloc(value?: string, countrySlug?: string): string | undefined {
  if (!value) {
    return countrySlug === "aether" ? "tecnologicos" : undefined;
  }

  const normalized = normalizeForSearch(normalizeCapturedLine(value));

  if (!normalized || normalized === "otro") {
    return countrySlug === "aether" ? "tecnologicos" : undefined;
  }

  if (/tecnopolis|tecnocr|(^|\W)tec($|\W)|aether/.test(normalized)) {
    return "tecnologicos";
  }

  if (/confederacion|relig|ummah/.test(normalized)) {
    return "religiosos";
  }

  if (/mixto|agro/.test(normalized)) {
    return "mixto";
  }

  return slugify(normalizeCapturedLine(value));
}

function looksLikeMasterTemplate(lines: string[]): boolean {
  const normalizedSet = new Set(lines.map(normalizeForSearch));
  return (
    normalizedSet.has(normalizeForSearch("Fichas de Hitos + Fichas de País")) &&
    normalizedSet.has(normalizeForSearch("FICHA DE HITO")) &&
    normalizedSet.has(normalizeForSearch("FICHA DE PAÍS / REGIÓN"))
  );
}

function looksLikeMasterHitosDocument(lines: string[]) {
  return lines.filter((_, index) => isMasterHitoStart(lines, index)).length >= 3;
}

function looksLikeMasterCountriesDocument(lines: string[]) {
  return lines.filter((_, index) => isMasterCountryStart(lines, index)).length >= 3;
}

function splitMasterHitoLines(lines: string[]): MasterImportChunk[] {
  const chunks: MasterImportChunk[] = [];
  let currentEraLine: string | undefined;
  let currentChunk: string[] | undefined;
  let currentMarker = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (isEraHeadingLine(lines, index)) {
      currentEraLine = line;
      continue;
    }

    if (isMasterHitoStart(lines, index)) {
      if (currentChunk?.length) {
        chunks.push({ marker: currentMarker, lines: currentChunk });
      }

      currentMarker = line;
      currentChunk = currentEraLine ? [currentEraLine, line] : [line];
      continue;
    }

    if (currentChunk) {
      currentChunk.push(line);
    }
  }

  if (currentChunk?.length) {
    chunks.push({ marker: currentMarker, lines: currentChunk });
  }

  return chunks;
}

function splitMasterCountryLines(lines: string[]): MasterImportChunk[] {
  const chunks: MasterImportChunk[] = [];
  let currentChunk: string[] | undefined;
  let currentMarker = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (isMasterCountryStart(lines, index)) {
      if (currentChunk?.length) {
        chunks.push({ marker: currentMarker, lines: currentChunk });
      }

      currentMarker = line;
      currentChunk = [line];
      continue;
    }

    if (currentChunk) {
      currentChunk.push(line);
    }
  }

  if (currentChunk?.length) {
    chunks.push({ marker: currentMarker, lines: currentChunk });
  }

  return chunks;
}

function buildMasterPreviewName(sourceFileName: string, marker: string, suffix?: string) {
  return [sourceFileName, marker, suffix].filter(Boolean).join(" · ");
}

function isMasterHitoStart(lines: string[], index: number) {
  return /^Hito\s+\d+$/i.test(lines[index] ?? "") && normalizeForSearch(lines[index + 1] ?? "") === normalizeForSearch("Nombre del Hito");
}

function isMasterCountryStart(lines: string[], index: number) {
  const next = lines[index + 1] ?? "";

  return Boolean(lines[index]?.trim()) && normalizeForSearch(next) === normalizeForSearch("País / Región");
}

function isEraHeadingLine(lines: string[], index: number) {
  const line = lines[index] ?? "";

  if (!/^ERA\s+\d+$/i.test(line)) {
    return false;
  }

  const previousLine = normalizeForSearch(lines[index - 1] ?? "");
  const nextLine = normalizeBlockLabel(lines[index + 1] ?? "");

  if (previousLine === normalizeForSearch("Era / Contexto")) {
    return false;
  }

  if (nextLine === normalizeBlockLabel("1. ANTECEDENTES")) {
    return false;
  }

  return true;
}

function scoreSignals(lines: string[], specs: BlockSpec[]): number {
  const normalizedSet = new Set(lines.map(normalizeBlockLabel));
  return specs.reduce(
    (total, spec) => total + (normalizedSet.has(normalizeBlockLabel(spec.label)) ? 1 : 0),
    0
  );
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function normalizeCapturedLine(line: string): string {
  const trimmed = line.trim();
  const bracketMatch = trimmed.match(/^\[(.*)\]$/);
  return (bracketMatch ? bracketMatch[1] : trimmed).trim();
}

function normalizeBlockLabel(line: string): string {
  return normalizeForSearch(normalizeCapturedLine(line))
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-+*]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/:\s*$/, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeHitoId(value?: string) {
  if (!value) {
    return undefined;
  }

  if (normalizeForSearch(normalizeCapturedLine(value)).startsWith("ej:")) {
    return undefined;
  }

  return extractHitoIds(value)[0];
}

function normalizeHitoReference(value?: string) {
  if (!value) {
    return undefined;
  }

  const matches = extractHitoIds(value);
  return matches.length > 0 ? matches.join(", ") : normalizeCapturedLine(value);
}

function formatHitoId(value: string | number) {
  return `H-${String(value).padStart(3, "0")}`;
}

function extractMarkdownImageSource(lines?: string[]) {
  if (!lines || lines.length === 0) {
    return undefined;
  }

  for (const line of lines) {
    const match = normalizeCapturedLine(line).match(/!\[[^\]]*]\(([^)]+)\)/);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

function isMarkdownImageLine(line: string) {
  return /^!\[[^\]]*]\([^)]+\)$/.test(line);
}

function isPlaceholderLine(line: string): boolean {
  const normalized = normalizeForSearch(normalizeCapturedLine(line));

  return (
    !normalized ||
    /^by /i.test(line) ||
    /^(copiar esta ficha|puntuar las variables|actualizar en cada era|1 = muy bajo|suma de las 7 variables|max: 35|para trackear como evolucionan las variables del pais a lo largo del historico\.)/.test(
      normalized
    ) ||
    /^(ej:.*|nombre del hito \(h2100\)|nombre del miembro de aile|descripcion de la imagen que deberia acompanar|eventos y crisis \/ tratados \/ tecnologia \/ etc\.?|infobox evento \/ infobox tratado \/ infobox conflicto \/ etc\.?|borrador \/ en revision \/ aprobado \/ publicado|justificacion breve)$/.test(
      normalized
    ) ||
    /^(que condiciones previas llevan a este hito\?|que pasa exactamente\? narrar los hechos clave en orden cronologico\.|que cambia en el mundo inmediatamente despues\? impacto en paises, bloques, poblacion\.|listar paises o regiones y como les afecta \(positiva o negativamente\)\.|que hitos anteriores causan este\? que hitos posteriores genera\.)$/.test(
      normalized
    )
  );
}

function looksLikeDescription(line: string): boolean {
  const normalized = normalizeForSearch(normalizeCapturedLine(line));

  return /sequias|inundaciones|instituciones|agua dulce|chips|emisor\/receptor|capacidad de organizarse|nivel de endeudamiento/i.test(
    normalized
  );
}
