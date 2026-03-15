import type { ReactNode } from "react";

import { humanizeSlug, slugify, startCase } from "@/lib/utils";
import type { NavHeading } from "@/types/wiki";

const wikiLinkPattern = /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g;

export function transformWikiLinks(markdown: string, articleTitles: Record<string, string>): string {
  return markdown.replace(wikiLinkPattern, (_, slug: string, label?: string) => {
    const resolvedLabel = label ?? articleTitles[slug] ?? humanizeSlug(slug);
    return `[${resolvedLabel}](wiki:${slug})`;
  });
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
