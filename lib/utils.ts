export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeQueryParam(value?: string | string[]): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => item.trim())
      .filter(Boolean)
      .join(" ");
  }

  return value?.trim() ?? "";
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[\[([^[\]|]+)\|?([^[\]]+)?\]\]/g, (_, slug: string, label?: string) => label ?? slug)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[*_`>#~-]/g, " ")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function formatYearRange(start?: number, end?: number): string {
  if (!start && !end) {
    return "Sin fecha";
  }

  if (start && end && start !== end) {
    return `${start} - ${end}`;
  }

  return String(start ?? end);
}

export function startCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}
