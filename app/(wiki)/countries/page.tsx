import { CountryPresenceBoard } from "@/components/country-presence-board";
import { countryOrganDefinitions } from "@/lib/country-organs";
import { getCountryDirectory, getPublicWikiCopy } from "@/lib/repository";

export default async function CountriesPage() {
  const [countries, copy] = await Promise.all([getCountryDirectory(), getPublicWikiCopy()]);
  const counts = countryOrganDefinitions.map((organ) => ({
    ...organ,
    total: countries.filter((country) => country.organMemberships?.includes(organ.slug)).length
  }));

  return (
    <div className="space-y-6">
      <section className="wiki-paper p-5 md:p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">{copy.countries.eyebrow}</p>
        <h1 className="wiki-page-title mt-2">{copy.countries.title}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
          {copy.countries.description}
        </p>
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

      <section className="wiki-paper p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl">{copy.countries.matrixTitle}</h2>
          <span className="text-sm text-wiki-muted">{copy.countries.matrixKicker}</span>
        </div>

        <CountryPresenceBoard countries={countries} copy={copy.countryPresenceBoard} />
      </section>
    </div>
  );
}
