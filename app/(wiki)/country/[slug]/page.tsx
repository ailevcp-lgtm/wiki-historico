import Image from "next/image";
import { notFound } from "next/navigation";

import { ArticleMarkdown } from "@/components/article-markdown";
import { CountryOrganSummary } from "@/components/country-presence-board";
import { CountryScorecard } from "@/components/country-scorecard";
import { getCountryProfileMarkdown } from "@/lib/country-profile";
import {
  getArticleHitoIndex,
  getArticleIndex,
  getCountryBySlug,
  getNavigationData,
  getPublicWikiCopy
} from "@/lib/repository";
import { applyCopyTemplate } from "@/lib/site-config/utils";
import { humanizeSlug } from "@/lib/utils";

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
  const profileMarkdown = getCountryProfileMarkdown(
    country.profileMarkdown || copy.countryPage.profileFallbackMarkdown,
    { stripImages: Boolean(country.mapUrl) }
  );

  return (
    <div className="space-y-6">
      <section className="wiki-paper p-5 md:p-6">
        <header className="border-b border-wiki-border pb-5">
          <div className="flex flex-wrap gap-2">
            <span className="wiki-badge">{copy.countryPage.badgeLabel}</span>
            {country.bloc ? <span className="wiki-badge">{humanizeSlug(country.bloc)}</span> : null}
            <CountryOrganSummary
              country={country}
              emptyLabel={copy.countryPage.noOrgansBadgeLabel}
            />
            <span className="wiki-badge">
              {applyCopyTemplate(copy.countryPage.snapshotBadgeTemplate, {
                count: country.scores.length
              })}
            </span>
          </div>
          <h1 className="wiki-page-title mt-4">{country.name}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
            {country.summary || copy.countryPage.summaryFallback}
          </p>
        </header>

        <div className="mt-6 space-y-6">
          {country.flagUrl ? (
            <section className="wiki-paper p-4">
              <h2 className="font-heading text-2xl">Representante</h2>
              <div className="mt-4 mx-auto max-w-sm overflow-hidden rounded-sm border border-wiki-border bg-white">
                <Image
                  src={country.flagUrl}
                  alt={`Foto del representante de ${country.name}`}
                  width={640}
                  height={800}
                  className="h-auto w-full object-contain"
                />
              </div>
            </section>
          ) : null}

          {country.mapUrl ? (
            <section className="wiki-paper p-4">
              <h2 className="font-heading text-2xl">{copy.countryPage.mapSectionTitle}</h2>
              <div className="mt-4 overflow-hidden rounded-sm border border-wiki-border bg-white">
                <Image
                  src={country.mapUrl}
                  alt={`Mapa de ${country.name}`}
                  width={960}
                  height={720}
                  className="h-auto w-full object-contain"
                />
              </div>
            </section>
          ) : null}

          <section className="wiki-paper p-5">
            <h2 className="font-heading text-2xl">{copy.countryPage.profileSectionTitle}</h2>
            <div className="mt-4">
              <ArticleMarkdown articleTitles={articleTitles} hitoArticles={hitoArticles} markdown={profileMarkdown} />
            </div>
          </section>

          <CountryScorecard
            country={country}
            copy={copy.countryScorecard}
            eras={navigation.eras}
            hitoArticles={hitoArticles}
          />
        </div>
      </section>
    </div>
  );
}
