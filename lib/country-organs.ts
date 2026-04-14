import type { Country, CountryOrganSlug } from "@/types/wiki";

export const countryOrganDefinitions: Array<{
  slug: CountryOrganSlug;
  label: string;
  subtitle?: string;
}> = [
  {
    slug: "ag",
    label: "AG"
  },
  {
    slug: "cdh",
    label: "CCH"
  },
  {
    slug: "csym",
    label: "CSyM",
    subtitle: "medioambiente"
  }
];

const organOrder = new Map(
  countryOrganDefinitions.map((organ, index) => [organ.slug, index] as const)
);

export function normalizeCountryOrganMemberships(
  organMemberships: Country["organMemberships"]
): CountryOrganSlug[] | undefined {
  if (!Array.isArray(organMemberships)) {
    return undefined;
  }

  const normalized = [...new Set(organMemberships)]
    .filter((slug): slug is CountryOrganSlug => organOrder.has(slug))
    .sort((left, right) => (organOrder.get(left) ?? 0) - (organOrder.get(right) ?? 0));

  return normalized;
}

export function getCountryOrganLabels(organMemberships: Country["organMemberships"]) {
  return normalizeCountryOrganMemberships(organMemberships)?.map((slug) => {
    const organ = countryOrganDefinitions.find((entry) => entry.slug === slug);
    return organ?.label ?? slug.toUpperCase();
  }) ?? [];
}

export function isFrontLoadedOrganMembership(
  organMemberships: Country["organMemberships"]
): boolean {
  const normalized = normalizeCountryOrganMemberships(organMemberships) ?? [];
  return normalized.every((slug, index) => countryOrganDefinitions[index]?.slug === slug);
}
