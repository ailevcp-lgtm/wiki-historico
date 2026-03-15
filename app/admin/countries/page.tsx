import Link from "next/link";

import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { requireEditorPageAccess } from "@/lib/editor/auth";
import { getAllCountries } from "@/lib/repository";
import { humanizeSlug } from "@/lib/utils";

export default async function AdminCountriesPage() {
  const access = await requireEditorPageAccess("/admin/countries");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }

  const countries = await getAllCountries();

  return (
    <section className="space-y-6">
      <EditorAccessNotice access={access} />

      <header className="wiki-paper p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Países y regiones</p>
            <h1 className="wiki-page-title mt-2">Editor de países</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
              Aquí se corrigen perfiles narrativos, bloques y snapshots de scorecard para cada actor territorial.
            </p>
          </div>
          <Link
            href="/admin/countries/new"
            className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold"
          >
            Nuevo país
          </Link>
        </div>
      </header>

      <section className="wiki-paper p-5 md:p-6">
        <div className="space-y-4">
          {countries.length === 0 ? (
            <p className="text-wiki-muted">Todavía no hay países o regiones cargados.</p>
          ) : (
            countries.map((country) => (
              <article key={country.slug} className="rounded-sm border border-wiki-border bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="wiki-badge">
                    {country.bloc ? humanizeSlug(country.bloc) : "sin-bloque"}
                  </span>
                  <span className="wiki-badge">{country.scores.length} snapshot(s)</span>
                </div>
                <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <h2 className="font-heading text-2xl">{country.name}</h2>
                    <p className="mt-2 text-wiki-muted">{country.summary}</p>
                    <p className="mt-2 text-sm text-wiki-muted">
                      <code>{country.slug}</code>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <Link href={`/admin/countries/${country.slug}`} className="wiki-link">
                        Editar ficha
                      </Link>
                      <Link href={`/country/${country.slug}`} className="wiki-link">
                        Ver ficha pública
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
