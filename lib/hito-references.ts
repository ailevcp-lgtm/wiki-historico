import type { HitoReferenceTarget } from "@/types/wiki";

export type HitoReferenceIndex = Record<string, HitoReferenceTarget>;

export function normalizeHitoId(value?: string | null) {
  const match = value?.match(/(\d{1,3})/);

  if (!match) {
    return undefined;
  }

  return `H-${match[1].padStart(3, "0")}`;
}

export function resolveHitoReference(
  hitoId: string | undefined,
  hitoArticles: HitoReferenceIndex
) {
  const normalizedHitoId = normalizeHitoId(hitoId);
  const fallbackLabel = hitoId?.trim();

  if (!normalizedHitoId) {
    return fallbackLabel
      ? {
          id: fallbackLabel,
          label: fallbackLabel,
          exists: false
        }
      : undefined;
  }

  const linkedArticle = hitoArticles[normalizedHitoId];

  if (linkedArticle) {
    return {
      id: normalizedHitoId,
      label: linkedArticle.title,
      href: linkedArticle.href,
      slug: linkedArticle.slug,
      exists: true
    };
  }

  return {
    id: normalizedHitoId,
    label: normalizedHitoId,
    exists: false
  };
}
