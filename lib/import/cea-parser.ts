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
import type { ArticleType, InfoboxData } from "@/types/wiki";

type BlockSpec = {
  key: string;
  label: string;
};

const HITO_FIELDS: BlockSpec[] = [
  { key: "hitoId", label: "ID del Hito" },
  { key: "title", label: "Título del artículo wiki" },
  { key: "sourceType", label: "Tipo" },
  { key: "location", label: "Ubicación / Alcance" },
  { key: "actors", label: "Actores principales" },
  { key: "eraContext", label: "Era / Contexto" }
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

const COUNTRY_FIELDS: BlockSpec[] = [
  { key: "name", label: "País / Región" },
  { key: "bloc", label: "Bloque (2085)" },
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

const COUNTRY_NARRATIVE: BlockSpec[] = [
  { key: "generalSituation", label: "Situación general" },
  { key: "geopolitics", label: "Posición geopolítica" },
  { key: "aether", label: "Relación con AETHER" },
  { key: "confederation", label: "Relación con la Confederación" },
  { key: "events", label: "Eventos clave que lo afectaron" },
  { key: "summitPosition", label: "Posición para la Cumbre 2100" }
];

const TEMPLATE_HEADINGS = new Set(
  [
    "FICHA DE HITO",
    "FICHA DE PAÍS / REGIÓN",
    "FICHA DE HITO — EJEMPLO",
    "Fichas de Hitos + Fichas de País",
    "Perfil Narrativo del País",
    "Variables del Mundo (puntuar 1 a 5)",
    "PUNTAJE TOTAL",
    "Historial de Puntajes por Era (opcional)"
  ].map(normalizeForSearch)
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

function parseHitoDocument(
  lines: string[],
  fileName: string,
  rawTextPreview: string
): HitoImportPreview {
  const issues: ImportIssue[] = [];
  const fieldBlocks = collectBlocks(lines, HITO_FIELDS, [...HITO_SECTIONS, ...COUNTRY_FIELDS]);
  const sectionBlocks = collectBlocks(lines, HITO_SECTIONS, [...COUNTRY_FIELDS]);

  const title = firstValue(fieldBlocks.title) ?? stripExtension(fileName);
  const sourceType = firstValue(fieldBlocks.sourceType);
  const location = firstValue(fieldBlocks.location);
  const actors = firstValue(fieldBlocks.actors);
  const eraContext = firstValue(fieldBlocks.eraContext);
  const hitoId = firstValue(fieldBlocks.hitoId);
  const eraSlug = parseEraSlug(eraContext);
  const articleType = normalizeArticleType(sourceType);
  const years = deriveYears(lines.join("\n"));
  const antecedentes = sectionBlocks.antecedentes ?? [];
  const conexiones = sectionBlocks.conexiones ?? [];
  const connectionHints = extractHitoIds(conexiones.join(" "));
  const summary = truncate(antecedentes.join(" "), 220);

  if (!fieldBlocks.title?.length) {
    issues.push({
      level: "warning",
      field: "title",
      message: "No encontré 'Título del artículo wiki'. Se usó el nombre del archivo como fallback."
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
      message: "No pude derivar el slug de era desde 'Era / Contexto'."
    });
  }

  if (!summary) {
    issues.push({
      level: "error",
      field: "antecedentes",
      message: "La ficha no trae contenido suficiente en 'Antecedentes' para generar un resumen."
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
    ...COUNTRY_VARIABLES,
    ...COUNTRY_NARRATIVE,
    { key: "puntaje", label: "PUNTAJE TOTAL" }
  ]);
  const variableBlocks = collectBlocks(lines, COUNTRY_VARIABLES, [
    ...COUNTRY_NARRATIVE,
    { key: "puntaje", label: "PUNTAJE TOTAL" },
    { key: "historial", label: "Historial de Puntajes por Era (opcional)" }
  ]);
  const narrativeBlocks = collectBlocks(lines, COUNTRY_NARRATIVE, [
    { key: "historial", label: "Historial de Puntajes por Era (opcional)" }
  ]);

  const name = firstValue(fieldBlocks.name) ?? stripExtension(fileName);
  const profileMarkdown = buildCountryMarkdown(narrativeBlocks);
  const summary = truncate(firstValue(narrativeBlocks.generalSituation) ?? "", 220);
  const eraSlug = parseEraSlug(firstValue(fieldBlocks.period));
  const scores = COUNTRY_VARIABLES.map((spec) =>
    parseCountryVariable(spec.label, variableBlocks[spec.key] ?? [])
  );

  if (!fieldBlocks.name?.length) {
    issues.push({
      level: "warning",
      field: "name",
      message: "No encontré 'País / Región'. Se usó el nombre del archivo como fallback."
    });
  }

  if (!eraSlug) {
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
      message: "No se encontró contenido suficiente en 'Situación general' para generar el resumen."
    });
  }

  if (scores.every((score) => score.score === undefined)) {
    issues.push({
      level: "warning",
      field: "scores",
      message: "No pude extraer puntajes 1-5 de la tabla principal. La ficha puede seguir vacía o con placeholders."
    });
  }

  const draft: CountryDraftCandidate = {
    name,
    slug: slugify(name),
    bloc: normalizeBloc(firstValue(fieldBlocks.bloc)),
    hitoReference: firstValue(fieldBlocks.hitoReference),
    eraSlug,
    summary: summary || `Perfil narrativo importado desde ${fileName}.`,
    profileMarkdown,
    scores
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
    extractedNarrative: simplifyBlocks(narrativeBlocks)
  };
}

function toLines(rawText: string): string[] {
  return rawText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => !isPlaceholderLine(line));
}

function collectBlocks(
  lines: string[],
  specs: BlockSpec[],
  extraStops: BlockSpec[] = []
): Record<string, string[]> {
  const blocks: Record<string, string[]> = {};
  const specMap = new Map(specs.map((spec) => [normalizeForSearch(spec.label), spec]));
  const stopSet = new Set([
    ...specs.map((spec) => normalizeForSearch(spec.label)),
    ...extraStops.map((spec) => normalizeForSearch(spec.label)),
    ...TEMPLATE_HEADINGS
  ]);

  for (let index = 0; index < lines.length; index += 1) {
    const current = normalizeForSearch(lines[index]);
    const matched = specMap.get(current);

    if (!matched) {
      continue;
    }

    const values: string[] = [];

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = lines[cursor];
      if (stopSet.has(normalizeForSearch(candidate))) {
        break;
      }

      if (!isPlaceholderLine(candidate)) {
        values.push(candidate);
      }
      index = cursor;
    }

    blocks[matched.key] = values;
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

function buildHitoMarkdown(sections: Record<string, string[]>): string {
  return [
    markdownSection("Contexto", sections.antecedentes ?? []),
    markdownSection("Desarrollo", sections.desarrollo ?? []),
    markdownSection("Consecuencias inmediatas", sections.consecuenciasInmediatas ?? []),
    markdownSection("Consecuencias a largo plazo", sections.consecuenciasLargoPlazo ?? []),
    markdownSection("Países y regiones afectados", sections.paisesAfectados ?? [], true),
    markdownSection("Datos clave para la wiki", sections.datosClave ?? [], true),
    markdownSection("Conexiones con otros hitos", sections.conexiones ?? [], true)
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildCountryMarkdown(narrative: Record<string, string[]>): string {
  return [
    markdownSection("Situación general", narrative.generalSituation ?? []),
    markdownSection("Posición geopolítica", narrative.geopolitics ?? []),
    markdownSection("Relación con AETHER", narrative.aether ?? []),
    markdownSection("Relación con la Confederación", narrative.confederation ?? []),
    markdownSection("Eventos clave", narrative.events ?? [], true),
    markdownSection("Posición para la Cumbre 2100", narrative.summitPosition ?? [])
  ]
    .filter(Boolean)
    .join("\n\n");
}

function markdownSection(title: string, lines: string[], forceBullets = false): string {
  if (lines.length === 0) {
    return "";
  }

  const body = forceBullets
    ? lines.map((line) => `- ${line}`).join("\n")
    : lines.map((line) => line.trim()).join("\n\n");

  return `## ${title}\n\n${body}`;
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

  const normalized = value.match(/Era\s+([IVX]+)/i);
  if (!normalized) {
    return undefined;
  }

  const roman = normalized[1].toUpperCase();
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

function extractHitoIds(value: string): string[] {
  return [...new Set((value.match(/H-\d+/gi) ?? []).map((match) => match.toUpperCase()))];
}

function parseCountryVariable(label: string, lines: string[]): CountryScoreDraft {
  const cleaned = lines.filter((line) => !looksLikeDescription(line));
  const scoreLine = cleaned.find((line) => /^[1-5]$/.test(line));
  const trendLine = cleaned.find((line) => /^(↑|↓|↔|up|down|stable)$/i.test(line));
  const notes = cleaned.filter((line) => line !== scoreLine && line !== trendLine).join(" ").trim();

  return {
    variable: label,
    score: scoreLine ? Number(scoreLine) : undefined,
    trend: normalizeTrend(trendLine),
    notes: notes || undefined
  };
}

function normalizeTrend(value?: string): "up" | "down" | "stable" | undefined {
  if (!value) {
    return undefined;
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

function normalizeBloc(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = normalizeForSearch(value);

  if (normalized.includes("tecnopolis")) {
    return "tecnopolis";
  }

  if (normalized.includes("confederacion")) {
    return "confederacion";
  }

  if (normalized.includes("agro")) {
    return "agro-energetico";
  }

  if (normalized.includes("vulnerable")) {
    return "vulnerables";
  }

  return slugify(value);
}

function looksLikeMasterTemplate(lines: string[]): boolean {
  const normalizedSet = new Set(lines.map(normalizeForSearch));
  return (
    normalizedSet.has(normalizeForSearch("Fichas de Hitos + Fichas de País")) &&
    normalizedSet.has(normalizeForSearch("FICHA DE HITO")) &&
    normalizedSet.has(normalizeForSearch("FICHA DE PAÍS / REGIÓN"))
  );
}

function scoreSignals(lines: string[], specs: BlockSpec[]): number {
  const normalizedSet = new Set(lines.map(normalizeForSearch));
  return specs.reduce(
    (total, spec) => total + (normalizedSet.has(normalizeForSearch(spec.label)) ? 1 : 0),
    0
  );
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function isPlaceholderLine(line: string): boolean {
  return (
    /^\[.*\]$/.test(line) ||
    /^(Copiar esta ficha|Puntuar las variables|Actualizar en cada era|1 = Muy bajo|Suma de las 7 variables)/i.test(
      line
    ) ||
    /^By /i.test(line)
  );
}

function looksLikeDescription(line: string): boolean {
  return (
    /sequias|inundaciones|instituciones|agua dulce|chips|emisor\/receptor|capacidad de organizarse|nivel de endeudamiento/i.test(
      normalizeForSearch(line)
    ) ||
    /^[\[\]1-5↑↓↔]+$/.test(line)
  );
}
