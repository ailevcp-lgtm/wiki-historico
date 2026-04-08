import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBlocDefinitionBySlug } from "@/lib/bloc-profiles";
import { CountryPresenceBoard } from "@/components/country-presence-board";
import { JsonLd } from "@/components/json-ld";
import {
  getBlocBySlug,
  getCountriesByBloc,
  getNavigationData
} from "@/lib/repository";
import {
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
  buildMetadata,
  metadataBase,
  siteTitle
} from "@/lib/seo";

export async function generateStaticParams() {
  return (await getNavigationData()).blocs.map((bloc) => ({ slug: bloc.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const bloc = await getBlocBySlug(resolvedParams.slug);

  if (!bloc) {
    return {
      metadataBase,
      ...buildMetadata({
        title: siteTitle,
        description: siteTitle,
        path: "/bloc",
        noIndex: true
      })
    };
  }

  const title = `${bloc.name} | ${siteTitle}`;

  return {
    metadataBase,
    ...buildMetadata({
      title,
      description: bloc.summary,
      path: `/bloc/${bloc.slug}`,
      imageAlt: bloc.name,
      keywords: [bloc.name, "bloque", "AILE", "wiki", "Histórico 2100"]
    }),
    title: { absolute: title }
  };
}

export default async function BlocPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const bloc = await getBlocBySlug(resolvedParams.slug);

  if (!bloc) {
    notFound();
  }

  const blocDetails = getBlocDefinitionBySlug(bloc.slug);
  const countries = await getCountriesByBloc(bloc.slug);

  return (
    <div className="space-y-6">
      <JsonLd
        data={[
          buildCollectionJsonLd({
            title: bloc.name,
            description: bloc.summary,
            path: `/bloc/${bloc.slug}`
          }),
          buildBreadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Bloques", path: "/" },
            { name: bloc.name, path: `/bloc/${bloc.slug}` }
          ])
        ]}
      />

      <section className="wiki-paper overflow-hidden">
        <div className="px-5 py-6 md:px-8" style={{ backgroundColor: bloc.color }}>
          <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Bloque</p>
          <h1 className="mt-2 font-heading text-4xl leading-tight text-wiki-text">{bloc.name}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">{bloc.summary}</p>
        </div>
        <div className="grid gap-4 border-t border-wiki-border px-5 py-5 md:grid-cols-2 md:px-8">
          <article className="rounded-sm border border-wiki-border bg-white p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-wiki-muted">Países asociados</div>
            <div className="mt-2 font-heading text-3xl">{countries.length}</div>
          </article>
        </div>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <div>
          <div>
            <h2 className="font-heading text-2xl">Características del bloque</h2>
            <p className="mt-2 text-sm text-wiki-muted">
              Detalle ampliado del enfoque político e institucional del bloque.
            </p>
          </div>
          <div className="mt-4 rounded-sm border border-wiki-border bg-white p-4">
            <p className="text-wiki-muted">
              {blocDetails?.longDescription ?? bloc.summary}
            </p>
            {blocDetails?.characteristics?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-wiki-muted">
                {blocDetails.characteristics.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <section className="wiki-paper min-w-0 p-5 md:p-6">
        <div className="mb-4">
          <h2 className="font-heading text-2xl">Matriz de participación del bloque</h2>
          <p className="mt-2 text-sm text-wiki-muted">
            Presencia institucional de los países asociados a {bloc.name}.
          </p>
        </div>

        <div className="min-w-0">
          {countries.length === 0 ? (
            <p className="text-sm text-wiki-muted">Todavía no hay países asociados a este bloque.</p>
          ) : (
            <CountryPresenceBoard countries={countries} />
          )}
        </div>
      </section>
    </div>
  );
}
