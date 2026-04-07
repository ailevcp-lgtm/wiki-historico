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
    <div className="min-w-0 max-w-full rounded-sm border border-wiki-border bg-white">
      <div className="max-w-full overflow-x-auto overscroll-x-contain">
        {countries.length === 0 ? (
          <div className="px-4 py-6 text-sm text-wiki-muted">
            No hay países para mostrar con este filtro.
          </div>
        ) : (
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-[#5b1739] text-white">
                {countryOrganDefinitions.map((organ) => (
                  <th
                    key={organ.slug}
                    className="w-1/3 border border-[#351024] px-1.5 py-1.5 text-center font-heading text-base font-semibold sm:px-2 sm:py-2 sm:text-lg md:px-4 md:py-3 md:text-3xl"
                  >
                    <span className="block break-words leading-none">{organ.label}</span>
                    {organ.subtitle ? (
                      <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80 md:mt-0 md:inline md:pl-1 md:text-sm md:normal-case md:tracking-normal">
                        {`(${organ.subtitle})`}
                      </span>
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

                if (activeCount === 0) {
                  return (
                    <tr key={country.slug}>
                        <td
                          colSpan={countryOrganDefinitions.length}
                          className="border border-wiki-border px-2 py-2 text-left text-xs text-wiki-muted sm:px-3 sm:text-sm md:px-4"
                        >
                          <Link href={`${hrefPrefix}/${country.slug}`} className={groupedRowLinkClass}>
                            <span className="font-semibold text-wiki-text">{country.name}</span>
                            <span className="ml-2 text-xs uppercase tracking-[0.12em] text-wiki-muted">
                            Sin órganos
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                }

                if (isFrontLoadedOrganMembership(organMemberships)) {
                  return (
                    <tr key={country.slug}>
                      {activeCount > 0 ? (
                        <td
                          colSpan={activeCount}
                          className={`border border-wiki-border px-1.5 py-1.5 text-center text-xs font-semibold sm:px-2 sm:py-2 sm:text-sm md:px-4 md:text-xl ${toneClass}`}
                        >
                          <Link href={`${hrefPrefix}/${country.slug}`} className={groupedRowLinkClass}>
                            <span className="block break-words">{country.name}</span>
                          </Link>
                        </td>
                      ) : null}

                      {Array.from({ length: missingCount }).map((_, index) => (
                        <td
                          key={`${country.slug}-empty-${index}`}
                          className="border border-wiki-border bg-[#a40000] px-1.5 py-1.5 sm:px-2 sm:py-2 md:px-4"
                        />
                      ))}
                    </tr>
                  );
                }

                return (
                  <tr key={country.slug}>
                    {countryOrganDefinitions.map((organ) => {
                      const isPresent = organMemberships.includes(organ.slug);
                      return (
                        <td
                          key={`${country.slug}-${organ.slug}`}
                          className={`border border-wiki-border px-1 py-1.5 text-center text-[11px] leading-tight sm:px-2 sm:py-2 sm:text-sm md:px-4 md:text-base ${
                            isPresent ? toneClass : "bg-[#a40000]"
                          }`}
                        >
                          {isPresent ? (
                            <Link href={`${hrefPrefix}/${country.slug}`} className={cellLinkClass}>
                              <span className="block break-words">{country.name}</span>
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
        )}
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
