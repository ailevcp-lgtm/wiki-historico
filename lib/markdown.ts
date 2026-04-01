import type { ReactNode } from "react";

import {
  findCanonicalCountry,
  listCanonicalCountries,
  normalizeCountryIdentityKey
} from "@/lib/import/country-normalization";
import type { HitoReferenceIndex } from "@/lib/hito-references";
import { humanizeSlug, normalizeForSearch, slugify, startCase, stripMarkdown, truncate } from "@/lib/utils";
import type { NavHeading } from "@/types/wiki";

const wikiLinkPattern = /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g;
const hitoReferencePattern = /\bH-?\s*(\d{1,3})(?:\s*[–-]\s*([^\],\n]+))?/giu;
const standaloneHitoReferencePattern = /^H-?\s*(\d{1,3})(?:\s*[–-]\s*([^\],\n]+))?$/iu;
const bracketedHitoListPattern = /\[([^\]\n]+)\]/gu;
const normalizedAffectedCountriesHeading = normalizeForSearch("Países y regiones afectados");
const normalizedKeyDataHeading = normalizeForSearch("Datos clave para la wiki");
const countryLinkCandidates = buildCountryLinkCandidates();
const countryMentionPattern =
  countryLinkCandidates.length > 0
    ? new RegExp(
        `(?<![\\p{L}\\p{N}])(${countryLinkCandidates
          .map((entry) => escapeRegExp(entry.alias))
          .join("|")})(?![\\p{L}\\p{N}])`,
        "giu"
      )
    : undefined;

export function transformWikiLinks(markdown: string, articleTitles: Record<string, string>): string {
  return markdown.replace(wikiLinkPattern, (_, slug: string, label?: string) => {
    const resolvedLabel = label ?? articleTitles[slug] ?? humanizeSlug(slug);
    return `[${resolvedLabel}](wiki:${slug})`;
  });
}

export function transformHitoReferences(
  markdown: string,
  hitoArticles: HitoReferenceIndex
): string {
  return markdown
    .split("\n")
    .map((line) => transformHitoReferencesInLine(line, hitoArticles))
    .join("\n");
}

export function normalizeImportedMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const normalizedLines: string[] = [];
  let activeSection: "affected" | "data" | undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      normalizedLines.push("");
      continue;
    }

    if (/^##\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^##\s+/, "").trim();
      const normalizedHeading = normalizeForSearch(heading);

      if (normalizedHeading === normalizedAffectedCountriesHeading) {
        activeSection = "affected";
        normalizedLines.push("## Países y regiones afectados");
        continue;
      }

      if (
        normalizedHeading === normalizedKeyDataHeading ||
        normalizedHeading === normalizeForSearch("Datos clave")
      ) {
        activeSection = "data";
        normalizedLines.push("## Datos clave");
        continue;
      }

      activeSection = undefined;
      normalizedLines.push(trimmed);
      continue;
    }

    if (/^###\s+/.test(trimmed)) {
      activeSection = undefined;
      normalizedLines.push(trimmed);
      continue;
    }

    if (activeSection === "affected") {
      normalizedLines.push(normalizeAffectedSectionLine(trimmed));
      continue;
    }

    if (activeSection === "data") {
      normalizedLines.push(normalizeKeyDataSectionLine(trimmed));
      continue;
    }

    normalizedLines.push(linkCountryMentionsInLine(trimmed));
  }

  return normalizedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function sanitizeArticleSummary(summary: string, markdown: string): string {
  const trimmedSummary = summary.trim();

  if (trimmedSummary && !looksLikeImportedTemplateSummary(trimmedSummary)) {
    return trimmedSummary;
  }

  const extractedSummary = extractSummaryFromMarkdown(markdown);
  if (extractedSummary) {
    return extractedSummary;
  }

  return trimmedSummary.replace(/^¿[^?]+\?\s*/, "").trim();
}

export function extractHeadings(markdown: string): NavHeading[] {
  const headings: NavHeading[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const text = line.replace(/^## /, "").trim();
      headings.push({ id: slugify(text), text, depth: 2 });
    } else if (line.startsWith("### ")) {
      const text = line.replace(/^### /, "").trim();
      headings.push({ id: slugify(text), text, depth: 3 });
    }
  }

  return headings;
}

export function flattenNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(flattenNodeText).join("");
  }

  if (node && typeof node === "object" && "props" in node) {
    return flattenNodeText((node as { props?: { children?: ReactNode } }).props?.children);
  }

  return "";
}

export function infoboxLabel(key: string): string {
  const overrides: Record<string, string> = {
    event_type: "Tipo",
    treaty_type: "Tratado",
    key_members: "Miembros clave",
    headquarters: "Sede",
    signatories: "Firmantes",
    casualties: "Impacto",
    summit_proposal: "Propuesta",
    related: "Relacionados"
  };

  return overrides[key] ?? startCase(key);
}

function normalizeAffectedSectionLine(line: string): string {
  const trimmedValue = stripListPrefix(line);
  const match = trimmedValue.match(/^\[?(Pa[ií]s|Regi[oó]n)\s+\d+\s*:\s*([^\]]+?)\]?\s*(?:\(([^)]+)\))?$/i);

  if (!match) {
    return linkCountryMentionsInLine(line);
  }

  const [, , rawName, rawImpact] = match;
  const name = rawName.trim();
  const impact = rawImpact?.trim();
  const label = buildCountryMarkdownLink(name);

  return `- **${label}**${impact ? ` (${impact})` : ""}`;
}

function normalizeKeyDataSectionLine(line: string): string {
  const trimmedValue = stripListPrefix(line);
  const match = trimmedValue.match(/^\[?Dato\s+\d+\s*:\s*(.+?)\]?$/i);

  if (!match) {
    return line;
  }

  return `- ${match[1].trim()}`;
}

function buildCountryMarkdownLink(name: string) {
  const canonical = findCanonicalCountry(name);
  return canonical ? `[${name}](country:${canonical.slug})` : `[[${slugify(name)}|${name}]]`;
}

function transformHitoReferencesInLine(
  line: string,
  hitoArticles: HitoReferenceIndex
) {
  if (!shouldLinkHitoReferences(line)) {
    return line;
  }

  const bracketedHitoLists: string[] = [];
  const lineWithPlaceholders = line.replace(bracketedHitoListPattern, (match, content: string) => {
    const references = content
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (references.length === 0 || !references.every((reference) => standaloneHitoReferencePattern.test(reference))) {
      return match;
    }

    const placeholder = `__CODEX_HITO_LIST_${bracketedHitoLists.length}__`;
    bracketedHitoLists.push(
      references.map((reference) => transformSingleHitoReference(reference, hitoArticles)).join(", ")
    );

    return placeholder;
  });

  const transformedLine = lineWithPlaceholders.replace(hitoReferencePattern, (match, digits: string, rawTitle?: string) =>
    buildHitoReferenceMarkdown(digits, rawTitle, hitoArticles, match)
  );

  return bracketedHitoLists.reduce(
    (current, replacement, index) => current.replace(`__CODEX_HITO_LIST_${index}__`, replacement),
    transformedLine
  );
}

function transformSingleHitoReference(reference: string, hitoArticles: HitoReferenceIndex) {
  const match = reference.match(standaloneHitoReferencePattern);

  if (!match) {
    return reference;
  }

  const [, digits, rawTitle] = match;
  return buildHitoReferenceMarkdown(digits, rawTitle, hitoArticles, reference);
}

function buildHitoReferenceMarkdown(
  digits: string,
  rawTitle: string | undefined,
  hitoArticles: HitoReferenceIndex,
  fallback: string
) {
  const normalizedHitoId = formatHitoId(digits);
  const linkedArticle = hitoArticles[normalizedHitoId];

  if (linkedArticle) {
    return `[${linkedArticle.title}](hito:${normalizedHitoId})`;
  }

  return rawTitle?.trim() ? `${normalizedHitoId} – ${rawTitle.trim()}` : fallback.replace(/^H-?\s*\d{1,3}/i, normalizedHitoId);
}

function linkCountryMentionsInLine(line: string): string {
  if (!countryMentionPattern || !shouldLinkCountryMentions(line)) {
    return line;
  }

  return line.replace(countryMentionPattern, (match) => {
    const canonical = findCanonicalCountry(match);
    return canonical ? `[${match}](country:${canonical.slug})` : match;
  });
}

function shouldLinkCountryMentions(line: string) {
  const trimmed = line.trim();

  if (!trimmed) {
    return false;
  }

  if (
    /^(#{1,6}\s|!\[|```|>)/.test(trimmed) ||
    trimmed.includes("](country:") ||
    trimmed.includes("](wiki:") ||
    trimmed.includes("[[")
  ) {
    return false;
  }

  return true;
}

function shouldLinkHitoReferences(line: string) {
  const trimmed = line.trim();

  if (!trimmed) {
    return false;
  }

  if (
    /^(#{1,6}\s|!\[|```|>)/.test(trimmed) ||
    trimmed.includes("](country:") ||
    trimmed.includes("](wiki:") ||
    trimmed.includes("[[")
  ) {
    return false;
  }

  return /H-?\s*\d{1,3}/i.test(trimmed);
}

function stripListPrefix(line: string) {
  return line.replace(/^[-+*]\s+/, "").trim();
}

function looksLikeImportedTemplateSummary(summary: string) {
  const normalized = normalizeForSearch(summary);

  return (
    normalized.startsWith(normalizeForSearch("¿Qué condiciones previas llevan a este hito?")) ||
    normalized.startsWith(normalizeForSearch("¿Qué pasa exactamente?")) ||
    normalized.startsWith(normalizeForSearch("¿Qué cambia en el mundo inmediatamente después?")) ||
    normalized.startsWith(normalizeForSearch("Borrador importado desde"))
  );
}

function extractSummaryFromMarkdown(markdown: string) {
  const normalizedMarkdown = normalizeImportedMarkdown(markdown);
  const lines = normalizedMarkdown
    .split("\n")
    .map((line) => stripMarkdown(line).trim())
    .filter(Boolean);

  for (const line of lines) {
    if (shouldSkipSummaryLine(line)) {
      continue;
    }

    return truncate(line, 220);
  }

  return "";
}

function shouldSkipSummaryLine(line: string) {
  const normalized = normalizeForSearch(line);

  return (
    normalized === normalizeForSearch("Contexto") ||
    normalized === normalizeForSearch("Desarrollo") ||
    normalized === normalizeForSearch("Consecuencias inmediatas") ||
    normalized === normalizeForSearch("Consecuencias a largo plazo") ||
    normalized === normalizedAffectedCountriesHeading ||
    normalized === normalizeForSearch("Datos clave") ||
    normalized === normalizeForSearch("Conexiones con otros hitos") ||
    /^dato\s+\d+\s*:/.test(normalized) ||
    /^(pais|region)\s+\d+\s*:/.test(normalized)
  );
}

function buildCountryLinkCandidates() {
  const uniqueCandidates = new Map<string, { alias: string; slug: string }>();

  for (const country of listCanonicalCountries()) {
    for (const alias of [country.name, ...country.aliases]) {
      const key = normalizeCountryIdentityKey(alias);

      if (!key || uniqueCandidates.has(key)) {
        continue;
      }

      uniqueCandidates.set(key, { alias, slug: country.slug });
    }
  }

  return [...uniqueCandidates.values()].sort((left, right) => right.alias.length - left.alias.length);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatHitoId(value: string | number) {
  return `H-${String(value).padStart(3, "0")}`;
}
