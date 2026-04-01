import Link from "next/link";

import {
  countryOrganDefinitions,
  getCountryOrganLabels,
  isFrontLoadedOrganMembership,
  normalizeCountryOrganMemberships
} from "@/lib/country-organs";
import type { Country, CountryPresenceBoardCopy } from "@/types/wiki";

interface CountryPresenceBoardProps {
  countries: Country[];
  copy?: CountryPresenceBoardCopy;
  hrefPrefix?: "/country" | "/admin/countries";
}

const toneByMembershipCount: Record<number, string> = {
  0: "bg-white text-wiki-muted",
  1: "bg-[#f3d1d1] text-wiki-text",
  2: "bg-[#d7e1f2] text-wiki-text",
  3: "bg-[#f3d1d1] text-wiki-text"
};

export function CountryPresenceBoard({
  countries,
  copy,
  hrefPrefix = "/country"
}: CountryPresenceBoardProps) {
  const isPublicWiki = hrefPrefix === "/country";
  const groupedRowLinkClass = isPublicWiki ? "block wiki-link-track" : "block hover:underline";
  const cellLinkClass = isPublicWiki
    ? "block font-semibold wiki-link-track"
    : "block font-semibold hover:underline";

  return (
    <div className="overflow-hidden rounded-sm border border-wiki-border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#5b1739] text-white">
              {countryOrganDefinitions.map((organ) => (
                <th
                  key={organ.slug}
                  className="border border-[#351024] px-4 py-3 text-center font-heading text-2xl font-semibold md:text-3xl"
                >
                  <span>{organ.label}</span>
                  {organ.subtitle ? (
                    <span className="ml-1 text-sm font-semibold text-white/80">({organ.subtitle})</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => {
              const organMemberships = normalizeCountryOrganMemberships(country.organMemberships) ?? [];
              const activeCount = organMemberships.length;
              const missingCount = countryOrganDefinitions.length - activeCount;
              const toneClass = toneByMembershipCount[activeCount] ?? toneByMembershipCount[0];

              if (isFrontLoadedOrganMembership(organMemberships)) {
                return (
                  <tr key={country.slug}>
                    {activeCount > 0 ? (
                      <td
                        colSpan={activeCount}
                        className={`border border-wiki-border px-4 py-2 text-center text-xl font-semibold ${toneClass}`}
                      >
                        <Link href={`${hrefPrefix}/${country.slug}`} className={groupedRowLinkClass}>
                          {country.name}
                        </Link>
                      </td>
                    ) : null}

                    {Array.from({ length: missingCount }).map((_, index) => (
                      <td
                        key={`${country.slug}-empty-${index}`}
                        className="border border-wiki-border bg-[#a40000] px-4 py-2"
                      />
                    ))}
                  </tr>
                );
              }

              return (
                <tr key={country.slug}>
                  {countryOrganDefinitions.map((organ, index) => {
                    const isPresent = organMemberships.includes(organ.slug);
                    return (
                      <td
                        key={`${country.slug}-${organ.slug}`}
                        className={`border border-wiki-border px-4 py-2 text-center ${
                          isPresent ? toneClass : "bg-[#a40000]"
                        }`}
                      >
                        {isPresent ? (
                          <Link href={`${hrefPrefix}/${country.slug}`} className={cellLinkClass}>
                            {index === 0 ? country.name : organ.label}
                          </Link>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-wiki-border bg-[#f8f5ef] px-4 py-3 text-sm text-wiki-muted">
        {copy?.footerText ??
          "Cada fila es clickeable. La presencia activa por órgano se marca en color y los espacios vacíos quedan reservados para los órganos donde ese país no participa."}
      </div>
    </div>
  );
}

export function CountryOrganSummary({
  country,
  emptyLabel = "Sin órganos"
}: {
  country: Country;
  emptyLabel?: string;
}) {
  const organLabels = getCountryOrganLabels(country.organMemberships);

  if (organLabels.length === 0) {
    return <span className="wiki-badge">{emptyLabel}</span>;
  }

  return (
    <>
      {organLabels.map((label) => (
        <span key={`${country.slug}-${label}`} className="wiki-badge">
          {label}
        </span>
      ))}
    </>
  );
}
