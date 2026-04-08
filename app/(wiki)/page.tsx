import type { Metadata } from "next";
import Link from "next/link";

import { buildMetadata, metadataBase, siteTitle } from "@/lib/seo";
import {
  getCountriesByBloc,
  getNavigationData,
  getPublicWikiCopy
} from "@/lib/repository";
import { formatYearRange } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getPublicWikiCopy();
  const title = siteTitle;

  return {
    metadataBase,
    ...buildMetadata({
      title,
      description: copy.home.heroDescription,
      path: "/",
      imageAlt: copy.home.heroTitle,
      keywords: ["portada", "inicio", "wiki", "historia futurista", "AILE"]
    }),
    title: { absolute: title }
  };
}

export default async function HomePage() {
  const [navigation, copy] = await Promise.all([getNavigationData(), getPublicWikiCopy()]);
  const { blocs, eras } = navigation;
  const blocCards = await Promise.all(
    blocs.map(async (bloc) => {
      const countries = await getCountriesByBloc(bloc.slug);

      return {
        ...bloc,
        countryCount: countries.length
      };
    })
  );

  return (
    <div className="space-y-6">
      <section className="wiki-paper overflow-hidden">
        <div className="border-b border-wiki-border bg-gradient-to-r from-[#f7f5ef] via-white to-[#e8eff7] px-5 py-8 md:px-8">
          <p className="mb-2 text-sm uppercase tracking-[0.24em] text-wiki-muted">
            {copy.home.heroEyebrow}
          </p>
          <h1 className="wiki-page-title max-w-3xl">{copy.home.heroTitle}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
            {copy.home.heroDescription}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-sm border border-wiki-border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-wiki-muted">
              Inscripciones al evento en
            </span>
            <a
              href="https://aile.com.ar"
              target="_blank"
              rel="noreferrer"
              className="rounded-sm border border-wiki-blue bg-white px-4 py-2 text-sm font-semibold text-wiki-blue hover:bg-[#edf4ff]"
            >
              aile.com.ar
            </a>
          </div>
        </div>

        <div className="space-y-3 px-5 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl">{copy.home.timelineSectionTitle}</h2>
          </div>

          <div className="grid gap-2 md:grid-cols-4">
            {eras.map((era) => (
              <Link
                key={era.slug}
                href={`/era/${era.slug}`}
                className="rounded-sm border border-wiki-border px-4 py-3 text-sm transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: era.color }}
              >
                <div className="font-semibold text-white">
                  {copy.shell.eraLabelPrefix} {era.number}: {era.name}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.12em] text-white/85">
                  {formatYearRange(era.yearStart, era.yearEnd)}
                </div>
              </Link>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/timeline"
              className="inline-flex w-full items-center justify-center rounded-sm border border-wiki-blue bg-[#edf4ff] px-4 py-3 text-center text-sm font-semibold text-wiki-blue hover:bg-[#dfeeff]"
            >
              {normalizeTimelineCopy(copy.home.timelineSectionLinkLabel, "Ver línea del tiempo completa")}
            </Link>
          </div>
        </div>
      </section>

      <section className="wiki-paper border-2 border-wiki-blue/50 bg-gradient-to-r from-[#fffdf7] via-white to-[#eef5ff] p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl">{copy.home.directorySectionTitle}</h2>
            <p className="mt-2 max-w-3xl text-wiki-muted">
              {copy.home.directorySectionDescription}
            </p>
          </div>
          <Link
            href="/countries"
            className="rounded-sm border border-wiki-blue bg-white px-4 py-2 text-sm font-semibold text-wiki-blue"
          >
            {copy.home.directorySectionButtonLabel}
          </Link>
        </div>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl">{copy.home.blocsSectionTitle}</h2>
          <span className="text-sm text-wiki-muted">{copy.home.blocsSectionKicker}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {blocCards.map((bloc) => (
            <Link
              key={bloc.slug}
              href={`/bloc/${encodeURIComponent(bloc.slug)}`}
              className="group rounded-sm border border-wiki-border p-4 transition-transform hover:-translate-y-0.5 hover:shadow-wiki"
              style={{ backgroundColor: bloc.color }}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-heading text-xl">{bloc.name}</h3>
                <span className="rounded-sm border border-wiki-border bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-wiki-muted">
                  {bloc.countryCount}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-wiki-muted">{bloc.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-wiki-muted">
                <span className="rounded-sm border border-wiki-border bg-white px-2 py-1">
                  {bloc.countryCount} países
                </span>
            
                <span className="rounded-sm border border-wiki-border bg-white px-2 py-1 group-hover:text-wiki-blue">
                  Ver bloque
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function normalizeTimelineCopy(value: string, fallback: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed.replace(/timeline/gi, "línea del tiempo");
}
