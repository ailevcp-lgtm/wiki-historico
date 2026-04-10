import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleMarkdown } from "@/components/article-markdown";
import { JsonLd } from "@/components/json-ld";
import { ZoomableImage } from "@/components/zoomable-image";
import { CountryOrganSummary } from "@/components/country-presence-board";
import { CountryScorecard } from "@/components/country-scorecard";
import { resolveCountryFlagUrl, resolveCountryRepresentativeUrl } from "@/lib/country-assets";
import { getCountryProfileMarkdown } from "@/lib/country-profile";
import {
  getArticleHitoIndex,
  getArticleIndex,
  getCountryBySlug,
  getCountryDirectory,
  getNavigationData,
  getPublicWikiCopy
} from "@/lib/repository";
import {
  buildBreadcrumbJsonLd,
  buildCountryJsonLd,
  buildMetadata,
  sanitizeMetaDescription
} from "@/lib/seo";
import { humanizeSlug } from "@/lib/utils";

export async function generateStaticParams() {
  return (await getCountryDirectory()).map((country) => ({ slug: country.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const country = await getCountryBySlug(resolvedParams.slug);

  if (!country) {
    return buildMetadata({
      title: "Ficha de país no encontrada",
      description: "La ficha solicitada no existe en la wiki de AILE.",
      path: `/country/${resolvedParams.slug}`,
      noIndex: true
    });
  }

  const description = sanitizeMetaDescription(
    `${country.summary || "Ficha país en desarrollo."} Explorala en la wiki de AILE.`
  );
  const canonicalPath = `/country/${country.slug}`;
  const title = country.name;
  const keywords = [
    country.name,
    "Ficha país",
    "AILE",
    "wiki.aile.com.ar",
    ...(country.bloc ? [humanizeSlug(country.bloc)] : []),
    ...(country.organMemberships ?? [])
  ];

  return buildMetadata({
    title,
    description,
    path: canonicalPath,
    imageAlt: `${country.name} en Histórico 2100`,
    keywords
  });
}

export default async function CountryPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const country = await getCountryBySlug(resolvedParams.slug);

  if (!country) {
    notFound();
  }

  const [articleTitles, hitoArticles, navigation, copy] = await Promise.all([
    getArticleIndex(),
    getArticleHitoIndex(),
    getNavigationData(),
    getPublicWikiCopy()
  ]);
  const canonicalPath = `/country/${country.slug}`;
  const description = sanitizeMetaDescription(
    `${country.summary || copy.countryPage.summaryFallback} Explorala en la wiki de AILE.`
  );
  const flagUrl = resolveCountryFlagUrl(country);
  const representativeUrl = resolveCountryRepresentativeUrl(country);
  const profileMarkdown = getCountryProfileMarkdown(
    country.profileMarkdown || copy.countryPage.profileFallbackMarkdown,
    { stripImages: Boolean(country.mapUrl) }
  );
  const seoJsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Portada", path: "/" },
      { name: "Países", path: "/countries" },
      { name: country.name, path: canonicalPath }
    ]),
    buildCountryJsonLd({
      name: country.name,
      description,
      path: canonicalPath,
      imagePath: flagUrl ?? country.mapUrl ?? `${canonicalPath}/opengraph-image`
    })
  ];

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden">
      <JsonLd data={seoJsonLd} />
      <section className="wiki-paper min-w-0 overflow-hidden p-5 md:p-6">
        <header className="border-b border-wiki-border pb-5">
          <div className="flex min-w-0 flex-wrap gap-2">
            <span className="wiki-badge">{copy.countryPage.badgeLabel}</span>
            {country.bloc ? <span className="wiki-badge">{humanizeSlug(country.bloc)}</span> : null}
            <CountryOrganSummary
              country={country}
              emptyLabel={copy.countryPage.noOrgansBadgeLabel}
            />
          </div>
          <h1 className="wiki-page-title mt-4">{country.name}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
            {country.summary || copy.countryPage.summaryFallback}
          </p>
        </header>

        <div className="mt-6 min-w-0 space-y-6">
          {flagUrl ? (
            <section className="wiki-paper min-w-0 overflow-hidden p-4">
              <h2 className="font-heading text-2xl">Bandera</h2>
              <div className="mt-4 max-w-full overflow-hidden rounded-sm border border-wiki-border bg-white">
                <ZoomableImage
                  src={flagUrl}
                  alt={`Bandera de ${country.name}`}
                  className="h-auto w-full object-contain"
                />
              </div>
            </section>
          ) : null}

          {representativeUrl ? (
            <section className="wiki-paper min-w-0 overflow-hidden p-4">
              <h2 className="font-heading text-2xl">Representante</h2>
              <div className="mt-4 mx-auto max-w-sm overflow-hidden rounded-sm border border-wiki-border bg-white">
                <ZoomableImage
                  src={representativeUrl}
                  alt={`Foto del representante de ${country.name}`}
                  className="h-auto w-full object-contain"
                />
              </div>
            </section>
          ) : null}

          {country.mapUrl ? (
            <section className="wiki-paper min-w-0 overflow-hidden p-4">
              <h2 className="font-heading text-2xl">{copy.countryPage.mapSectionTitle}</h2>
              <div className="mt-4 max-w-full overflow-hidden rounded-sm border border-wiki-border bg-white">
                <ZoomableImage
                  src={country.mapUrl}
                  alt={`Mapa de ${country.name}`}
                  className="h-auto w-full object-contain"
                />
              </div>
            </section>
          ) : null}

          <section className="wiki-paper min-w-0 overflow-hidden p-5">
            <h2 className="font-heading text-2xl">{copy.countryPage.profileSectionTitle}</h2>
            <div className="mt-4 min-w-0 overflow-hidden break-words [&_a]:break-words [&_h1]:break-words [&_h2]:break-words [&_h3]:break-words [&_li]:break-words [&_p]:break-words">
              <ArticleMarkdown
                articleTitles={articleTitles}
                hitoArticles={hitoArticles}
                markdown={profileMarkdown}
                openInternalLinksInNewTab
              />
            </div>
          </section>

          <CountryScorecard
            country={country}
            copy={copy.countryScorecard}
            eras={navigation.eras}
            hitoArticles={hitoArticles}
            showSnapshotsStat={false}
          />
        </div>
      </section>
    </div>
  );
}
