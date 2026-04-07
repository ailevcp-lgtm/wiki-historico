import type { Metadata } from "next";
import Link from "next/link";

import { CountryPresenceBoard } from "@/components/country-presence-board";
import { JsonLd } from "@/components/json-ld";
import { countryOrganDefinitions, normalizeCountryOrganMemberships } from "@/lib/country-organs";
import { getCountryDirectory, getNavigationData, getPublicWikiCopy } from "@/lib/repository";
import { normalizeQueryParam } from "@/lib/utils";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
  buildMetadata,
  metadataBase,
  siteTitle
} from "@/lib/seo";

export async function generateMetadata({
  searchParams
}: {
  searchParams?: Promise<{ bloc?: string | string[] }>;
}): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedBloc = normalizeQueryParam(resolvedSearchParams?.bloc);
  const [copy, navigation] = await Promise.all([getPublicWikiCopy(), getNavigationData()]);
  const activeBloc = navigation.blocs.find((bloc) => bloc.slug === selectedBloc);
  const title = activeBloc
    ? `${copy.countries.title} - ${activeBloc.name} | ${siteTitle}`
    : `${copy.countries.title} | ${siteTitle}`;
  const description = activeBloc
    ? `${copy.countries.description} Filtrado por ${activeBloc.name}.`
    : copy.countries.description;
  const metadata = buildMetadata({
    title,
    description,
    path: "/countries",
    imagePath: "/countries/opengraph-image",
    imageAlt: copy.countries.title,
    keywords: ["países", "regiones", "directorio", "wiki", "AILE", ...(activeBloc ? [activeBloc.name] : [])],
    noIndex: Boolean(activeBloc)
  });

  return {
    metadataBase,
    ...metadata,
    title: { absolute: title },
    openGraph: {
      ...(metadata.openGraph ?? {}),
      url: absoluteUrl(selectedBloc ? `/countries?bloc=${encodeURIComponent(selectedBloc)}` : "/countries")
    }
  };
}

export default async function CountriesPage({
  searchParams
}: {
  searchParams?: Promise<{ bloc?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedBloc = normalizeQueryParam(resolvedSearchParams?.bloc);
  const [countries, copy, navigation] = await Promise.all([
    getCountryDirectory(),
    getPublicWikiCopy(),
    getNavigationData()
  ]);
  const activeBloc = navigation.blocs.find((bloc) => bloc.slug === selectedBloc);
  const filteredCountries = activeBloc
    ? countries.filter((country) => country.bloc === activeBloc.slug)
    : countries;
  const counts = countryOrganDefinitions.map((organ) => ({
    ...organ,
    total: filteredCountries.filter((country) =>
      normalizeCountryOrganMemberships(country.organMemberships)?.includes(organ.slug)
    ).length
  }));
  const matrixCountries = filteredCountries.filter((country) =>
    normalizeCountryOrganMemberships(country.organMemberships)?.includes("ag")
  );
  const agCount = counts.find((organ) => organ.slug === "ag")?.total ?? matrixCountries.length;

  return (
    <div className="space-y-6">
      <JsonLd
        data={[
          buildCollectionJsonLd({
            title: copy.countries.title,
            description: copy.countries.description,
            path: "/countries"
          }),
          buildBreadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: copy.countries.title, path: "/countries" }
          ])
        ]}
      />
      <section className="wiki-paper p-5 md:p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">{copy.countries.eyebrow}</p>
        <h1 className="wiki-page-title mt-2">{copy.countries.title}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
          {copy.countries.description}
        </p>
        {activeBloc ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-sm border border-wiki-border bg-wiki-page px-3 py-2 text-sm text-wiki-muted">
            <span>Filtrado por</span>
            <span className="wiki-badge">{activeBloc.name}</span>
            <Link href="/countries" className="wiki-link wiki-link-track font-semibold">
              Limpiar filtro
            </Link>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {counts.map((organ) => (
          <article key={organ.slug} className="wiki-paper p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-wiki-muted">
              {organ.label}
              {organ.subtitle ? ` · ${organ.subtitle}` : ""}
            </div>
            <div className="mt-2 font-heading text-3xl">{organ.total}</div>
            <p className="mt-2 text-sm text-wiki-muted">{copy.countries.organCountDescription}</p>
          </article>
        ))}
      </section>

      <section className="wiki-paper min-w-0 p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl">{copy.countries.matrixTitle}</h2>
            <p className="mt-2 text-sm text-wiki-muted">
              {agCount} con presencia en AG
            </p>
          </div>
        </div>

        <CountryPresenceBoard countries={matrixCountries} copy={copy.countryPresenceBoard} />
      </section>
    </div>
  );
}
