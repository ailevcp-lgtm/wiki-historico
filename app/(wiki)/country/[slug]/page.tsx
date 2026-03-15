import { notFound } from "next/navigation";

import { ArticleMarkdown } from "@/components/article-markdown";
import { CountryScorecard } from "@/components/country-scorecard";
import { sortCountryScores } from "@/lib/country-scores";
import { getArticleIndex, getCountryBySlug, getNavigationData } from "@/lib/repository";
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

  const articleTitles = await getArticleIndex();
  const navigation = getNavigationData();
  const orderedScores = sortCountryScores(country.scores, navigation.eras);
  const latestScore = orderedScores[orderedScores.length - 1];

  return (
    <div className="space-y-6">
      <section className="wiki-paper p-5 md:p-6">
        <header className="border-b border-wiki-border pb-5">
          <div className="flex flex-wrap gap-2">
            <span className="wiki-badge">Ficha país</span>
            {country.bloc ? <span className="wiki-badge">{humanizeSlug(country.bloc)}</span> : null}
            <span className="wiki-badge">{country.scores.length} snapshot(s)</span>
          </div>
          <h1 className="wiki-page-title mt-4">{country.name}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">{country.summary}</p>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="wiki-paper p-5">
              <h2 className="font-heading text-2xl">Perfil narrativo</h2>
              <div className="mt-4">
                <ArticleMarkdown articleTitles={articleTitles} markdown={country.profileMarkdown} />
              </div>
            </section>

            <CountryScorecard country={country} eras={navigation.eras} />
          </div>

          <aside className="space-y-4">
            <section className="wiki-paper p-4">
              <h2 className="font-heading text-2xl">Resumen rápido</h2>
              <div className="mt-4 space-y-2">
                <ScoreRow label="Snapshots" value={String(country.scores.length)} />
                <ScoreRow
                  label="Bloque"
                  value={country.bloc ? humanizeSlug(country.bloc) : "Sin bloque"}
                />
                <ScoreRow
                  label="Última era"
                  value={latestScore?.eraSlug ? humanizeSlug(latestScore.eraSlug) : "Sin era"}
                />
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between rounded-sm border border-wiki-border bg-wiki-page px-3 py-2">
      <span className="text-sm text-wiki-muted">{label}</span>
      <span className="font-heading text-xl">{value ?? "?"}</span>
    </div>
  );
}
