import type { ReactNode } from "react";

import { HitoReference } from "@/components/hito-reference";
import type { HitoReferenceIndex } from "@/lib/hito-references";
import {
  countryScoreMetrics,
  describeScoreSnapshot,
  getCountryScoreTrend,
  getCountryScoreValue,
  getScoreTone,
  getTrendSymbol,
  sortCountryScores
} from "@/lib/country-scores";
import { humanizeSlug } from "@/lib/utils";
import type { Country, CountryScore, CountryScorecardCopy, TimelineEra } from "@/types/wiki";

export function CountryScorecard({
  country,
  copy,
  eras,
  hitoArticles,
  showSnapshotsStat = true
}: {
  country: Country;
  copy: CountryScorecardCopy;
  eras: TimelineEra[];
  hitoArticles: HitoReferenceIndex;
  showSnapshotsStat?: boolean;
}) {
  const orderedScores = sortCountryScores(country.scores, eras);
  const latestScore = orderedScores[orderedScores.length - 1];

  if (!latestScore) {
    return (
      <section className="wiki-paper p-4">
        <h2 className="font-heading text-2xl">{copy.emptyTitle}</h2>
        <p className="mt-3 text-sm text-wiki-muted">{copy.emptyDescription}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <section className="wiki-paper min-w-0 overflow-hidden p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="font-heading text-2xl">{copy.latestTitle}</h2>
            <p className="mt-2 min-w-0 text-sm text-wiki-muted">
              {renderScoreReference(latestScore, eras, hitoArticles)}
            </p>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-3">
            {showSnapshotsStat ? (
              <StatCard label={copy.snapshotsLabel} value={String(orderedScores.length)} />
            ) : null}
            <StatCard
              label={copy.blocLabel}
              value={country.bloc ? humanizeSlug(country.bloc) : copy.noBlocValue}
            />
            <StatCard
              label={copy.lastMilestoneLabel}
              value={
                latestScore.hitoId ? (
                  <HitoReference
                    hitoId={latestScore.hitoId}
                    hitoArticles={hitoArticles}
                    missingClassName="text-wiki-text"
                  />
                ) : (
                  copy.noMilestoneValue
                )
              }
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-2">
            {countryScoreMetrics.map((metric) => {
              const value = getCountryScoreValue(latestScore, metric.valueKey);
              const trend = getCountryScoreTrend(latestScore, metric.trendKey);

              return (
                <div
                  key={metric.valueKey}
                  className={`flex items-center justify-between rounded-sm border border-wiki-border px-3 py-2 ${getScoreTone(value)}`}
                >
                  <span className="text-sm text-wiki-muted">{metric.label}</span>
                  <span className="font-heading text-xl">
                    {value ?? "?"} <span className="text-sm text-wiki-muted">{getTrendSymbol(trend)}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <CountryRadarChart score={latestScore} />
        </div>

        {latestScore.notes ? (
          <div className="mt-5 min-w-0 rounded-sm border border-wiki-border bg-wiki-page p-3 text-sm text-wiki-muted break-words">
            {latestScore.notes}
          </div>
        ) : null}
      </section>

      <section className="wiki-paper min-w-0 overflow-hidden p-4">
        <h2 className="font-heading text-2xl">{copy.historyTitle}</h2>
        <div className="mt-4 max-w-full overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-sm">
            <thead className="bg-wiki-page">
              <tr>
                <th className="border border-wiki-border px-3 py-2 text-left">
                  {copy.referenceColumnLabel}
                </th>
                {countryScoreMetrics.map((metric) => (
                  <th key={metric.valueKey} className="border border-wiki-border px-3 py-2 text-left">
                    {metric.shortLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedScores.map((score) => (
                <tr key={describeScoreSnapshot(score, eras)}>
                  <td className="border border-wiki-border px-3 py-2 text-wiki-muted break-words">
                    {renderScoreReference(score, eras, hitoArticles)}
                  </td>
                  {countryScoreMetrics.map((metric) => {
                    const value = getCountryScoreValue(score, metric.valueKey);
                    const trend = getCountryScoreTrend(score, metric.trendKey);

                    return (
                      <td
                        key={`${describeScoreSnapshot(score, eras)}-${metric.valueKey}`}
                        className="border border-wiki-border px-3 py-2"
                      >
                        <span className="font-semibold">{value ?? "?"}</span>{" "}
                        <span className="text-wiki-muted">{getTrendSymbol(trend)}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-sm border border-wiki-border bg-wiki-page px-3 py-2">
      <div className="text-xs uppercase tracking-[0.12em] text-wiki-muted">{label}</div>
      <div className="mt-1 min-w-0 break-words font-heading text-xl">{value}</div>
    </div>
  );
}

function renderScoreReference(
  score: CountryScore,
  eras: TimelineEra[],
  hitoArticles: HitoReferenceIndex
) {
  const eraLabel = score.eraSlug
    ? eras.find((era) => era.slug === score.eraSlug)?.name ?? score.eraSlug
    : "Sin era";

  if (!score.hitoId) {
    return eraLabel;
  }

  return (
    <>
      <span className="hidden md:inline">
        {eraLabel} ·{" "}
        <HitoReference
          hitoId={score.hitoId}
          hitoArticles={hitoArticles}
          missingClassName="text-wiki-muted"
        />
      </span>
      <span className="md:hidden">
        <span className="block">{eraLabel}</span>
        <span className="block">
          <HitoReference
            hitoId={score.hitoId}
            hitoArticles={hitoArticles}
            missingClassName="text-wiki-muted"
          />
        </span>
      </span>
    </>
  );
}

function CountryRadarChart({ score }: { score: CountryScore }) {
  const size = 280;
  const center = size / 2;
  const radius = 86;
  const rings = [1, 2, 3, 4, 5];
  const labelRadius = radius + 30;

  const polygonPoints = countryScoreMetrics
    .map((metric, index) => {
      const value = Math.max(0, Math.min(5, getCountryScoreValue(score, metric.valueKey) ?? 0));
      const angle = (-Math.PI / 2) + (index / countryScoreMetrics.length) * Math.PI * 2;
      return polarPoint(center, center, (value / 5) * radius, angle);
    })
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="max-w-full overflow-hidden rounded-sm border border-wiki-border bg-wiki-page p-3">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-[320px]">
        {rings.map((ring) => {
          const ringPoints = countryScoreMetrics
            .map((_, index) => {
              const angle = (-Math.PI / 2) + (index / countryScoreMetrics.length) * Math.PI * 2;
              return polarPoint(center, center, (ring / 5) * radius, angle);
            })
            .map((point) => `${point.x},${point.y}`)
            .join(" ");

          return (
            <polygon
              key={ring}
              points={ringPoints}
              fill="none"
              stroke="#c8ccd1"
              strokeWidth="1"
            />
          );
        })}

        {countryScoreMetrics.map((metric, index) => {
          const angle = (-Math.PI / 2) + (index / countryScoreMetrics.length) * Math.PI * 2;
          const axisEnd = polarPoint(center, center, radius, angle);
          const labelPoint = polarPoint(center, center, labelRadius, angle);

          return (
            <g key={metric.valueKey}>
              <line x1={center} y1={center} x2={axisEnd.x} y2={axisEnd.y} stroke="#c8ccd1" strokeWidth="1" />
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                fontSize="11"
                fill="#54595d"
              >
                {metric.shortLabel}
              </text>
            </g>
          );
        })}

        <polygon points={polygonPoints} fill="rgba(6,69,173,0.18)" stroke="#0645AD" strokeWidth="2" />
        <circle cx={center} cy={center} r="2.5" fill="#0645AD" />
      </svg>
    </div>
  );
}

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius
  };
}
