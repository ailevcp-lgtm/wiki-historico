"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import type { PublicWikiCopy, WikiSiteConfig } from "@/types/wiki";

type CopyField = {
  key: string;
  label: string;
  multiline?: boolean;
  rows?: number;
};

const shellFields: CopyField[] = [
  { key: "siteTitle", label: "Título del sitio" },
  { key: "siteTagline", label: "Bajada corta" },
  { key: "searchPlaceholder", label: "Placeholder buscador" },
  { key: "searchButtonLabel", label: "Botón buscador" },
  { key: "navigationSectionTitle", label: "Título sección navegación" },
  { key: "homeLabel", label: "Link portada" },
  { key: "timelineLabel", label: "Link timeline" },
  { key: "searchLabel", label: "Link búsqueda" },
  { key: "countriesLabel", label: "Link países" },
  { key: "erasSectionTitle", label: "Título sección eras" },
  { key: "categoriesSectionTitle", label: "Título sección categorías" },
  { key: "blocsSectionTitle", label: "Título sección bloques" },
  { key: "eraLabelPrefix", label: "Prefijo de era" }
];

const homeFields: CopyField[] = [
  { key: "heroEyebrow", label: "Eyebrow portada" },
  { key: "heroTitle", label: "Título portada" },
  { key: "heroDescription", label: "Descripción portada", multiline: true, rows: 3 },
  { key: "timelineSectionTitle", label: "Título bloque cronología" },
  { key: "timelineSectionLinkLabel", label: "Link timeline completo" },
  { key: "blocsSectionTitle", label: "Título bloques" },
  { key: "blocsSectionKicker", label: "Kicker bloques" },
  { key: "directorySectionTitle", label: "Título directorio países" },
  { key: "directorySectionDescription", label: "Descripción directorio países", multiline: true, rows: 3 },
  { key: "directorySectionButtonLabel", label: "Botón directorio países" }
];

const timelineFields: CopyField[] = [
  { key: "eyebrow", label: "Eyebrow timeline" },
  { key: "title", label: "Título timeline" },
  { key: "description", label: "Descripción timeline", multiline: true, rows: 3 },
  { key: "allErasLabel", label: "Opción todas las eras" },
  { key: "allTypesLabel", label: "Opción todos los tipos" },
  { key: "allBlocsLabel", label: "Opción todos los bloques" },
  { key: "filterButtonLabel", label: "Botón filtrar" },
  { key: "emptyMessage", label: "Mensaje sin resultados", multiline: true, rows: 2 }
];

const searchFields: CopyField[] = [
  { key: "eyebrow", label: "Eyebrow búsqueda" },
  { key: "title", label: "Título búsqueda" },
  { key: "description", label: "Descripción búsqueda", multiline: true, rows: 3 },
  { key: "placeholder", label: "Placeholder búsqueda" },
  { key: "buttonLabel", label: "Botón búsqueda" },
  { key: "emptyQueryMessage", label: "Mensaje inicial" },
  { key: "noResultsTemplate", label: "Template sin resultados", multiline: true, rows: 2 }
];

const countriesFields: CopyField[] = [
  { key: "eyebrow", label: "Eyebrow países" },
  { key: "title", label: "Título países" },
  { key: "description", label: "Descripción países", multiline: true, rows: 3 },
  { key: "organCountDescription", label: "Descripción tarjetas por órgano", multiline: true, rows: 2 },
  { key: "matrixTitle", label: "Título matriz" },
  { key: "matrixKicker", label: "Kicker matriz" }
];

const countryPageFields: CopyField[] = [
  { key: "badgeLabel", label: "Badge ficha país" },
  { key: "snapshotBadgeTemplate", label: "Template badge snapshots" },
  { key: "summaryFallback", label: "Resumen fallback", multiline: true, rows: 3 },
  { key: "mapSectionTitle", label: "Título sección mapa" },
  { key: "profileSectionTitle", label: "Título perfil narrativo" },
  { key: "profileFallbackMarkdown", label: "Markdown fallback perfil", multiline: true, rows: 5 },
  { key: "quickSummaryTitle", label: "Título resumen rápido" },
  { key: "quickSummarySnapshotsLabel", label: "Label snapshots" },
  { key: "quickSummaryBlocLabel", label: "Label bloque" },
  { key: "quickSummaryLatestEraLabel", label: "Label última era" },
  { key: "quickSummaryOrgansLabel", label: "Label órganos" },
  { key: "quickSummaryMapLabel", label: "Label mapa" },
  { key: "quickSummaryNoBlocValue", label: "Valor sin bloque" },
  { key: "quickSummaryNoEraValue", label: "Valor sin era" },
  { key: "quickSummaryMapAvailableValue", label: "Valor mapa disponible" },
  { key: "quickSummaryMapPendingValue", label: "Valor mapa pendiente" },
  { key: "noOrgansBadgeLabel", label: "Badge sin órganos" }
];

const countryScorecardFields: CopyField[] = [
  { key: "emptyTitle", label: "Título scorecard vacío" },
  { key: "emptyDescription", label: "Descripción scorecard vacío", multiline: true, rows: 2 },
  { key: "latestTitle", label: "Título scorecard reciente" },
  { key: "snapshotsLabel", label: "Label snapshots" },
  { key: "blocLabel", label: "Label bloque" },
  { key: "noBlocValue", label: "Valor sin bloque" },
  { key: "lastMilestoneLabel", label: "Label último hito" },
  { key: "noMilestoneValue", label: "Valor sin hito" },
  { key: "historyTitle", label: "Título historial" },
  { key: "referenceColumnLabel", label: "Label columna referencia" }
];

const countryPresenceBoardFields: CopyField[] = [
  { key: "footerText", label: "Texto pie matriz", multiline: true, rows: 3 }
];

const eraPageFields: CopyField[] = [{ key: "sectionTitle", label: "Título bloque de hitos" }];
const categoryPageFields: CopyField[] = [{ key: "eyebrow", label: "Eyebrow categoría" }];
const articlePageFields: CopyField[] = [
  { key: "categoriesSectionTitle", label: "Título categorías artículo" },
  { key: "relatedSectionTitle", label: "Título ver también" },
  { key: "tableOfContentsTitle", label: "Título tabla de contenidos" }
];

interface SiteConfigEditorProps {
  initialConfig: WikiSiteConfig;
}

export function SiteConfigEditor({ initialConfig }: SiteConfigEditorProps) {
  const router = useRouter();
  const [config, setConfig] = useState<WikiSiteConfig>(initialConfig);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/editor/site-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      });

      const responsePayload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(responsePayload.error ?? "No se pudo guardar la configuración.");
        return;
      }

      setMessage("Configuración pública guardada.");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Falló el guardado de la configuración pública.");
    }
  }

  function updateEra(index: number, key: keyof WikiSiteConfig["eras"][number], value: string) {
    setConfig((current) => ({
      ...current,
      eras: current.eras.map((era, eraIndex) =>
        eraIndex === index
          ? {
              ...era,
              [key]:
                key === "number" || key === "yearStart" || key === "yearEnd"
                  ? Number(value)
                  : value
            }
          : era
      )
    }));
  }

  function updateCategory(index: number, key: keyof WikiSiteConfig["categories"][number], value: string) {
    setConfig((current) => ({
      ...current,
      categories: current.categories.map((category, categoryIndex) =>
        categoryIndex === index
          ? {
              ...category,
              [key]: value
            }
          : category
      )
    }));
  }

  function updateBloc(index: number, key: keyof WikiSiteConfig["blocs"][number], value: string) {
    setConfig((current) => ({
      ...current,
      blocs: current.blocs.map((bloc, blocIndex) =>
        blocIndex === index
          ? {
              ...bloc,
              [key]: value
            }
          : bloc
      )
    }));
  }

  function updateCopy(
    section: keyof PublicWikiCopy,
    key: string,
    value: string
  ) {
    setConfig((current) => ({
      ...current,
      copy: {
        ...current.copy,
        [section]: {
          ...((current.copy[section] as unknown) as Record<string, string>),
          [key]: value
        }
      }
    }));
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="wiki-paper p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Configuración pública</p>
            <h1 className="wiki-page-title mt-2">Textos y taxonomías editables</h1>
            <p className="mt-3 max-w-3xl text-wiki-muted">
              Aquí puedes ajustar los títulos visibles de la wiki, las descripciones públicas, las eras,
              categorías y bloques. La metadata global del sitio queda fuera de este panel.
            </p>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-sm border border-[#5b1739] bg-[#5b1739] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>

        {message ? <Notice tone="success">{message}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <div className="mb-5">
          <h2 className="font-heading text-2xl">Eras</h2>
          <p className="mt-2 text-sm text-wiki-muted">
            Los slugs se conservan como referencia técnica. Aquí editas el nombre público, rangos y estilo.
          </p>
        </div>

        <div className="space-y-4">
          {config.eras.map((era, index) => (
            <div key={era.slug} className="rounded-sm border border-wiki-border bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading text-2xl">{era.name}</div>
                  <div className="text-sm text-wiki-muted">Slug fijo: {era.slug}</div>
                </div>
                <div
                  className="h-10 w-10 rounded border border-wiki-border"
                  style={{ backgroundColor: era.color }}
                  aria-hidden="true"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Número">
                  <input
                    type="number"
                    value={String(era.number)}
                    onChange={(event) => updateEra(index, "number", event.target.value)}
                    className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                  />
                </Field>
                <Field label="Nombre">
                  <input
                    value={era.name}
                    onChange={(event) => updateEra(index, "name", event.target.value)}
                    className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                  />
                </Field>
                <Field label="Año inicial">
                  <input
                    type="number"
                    value={String(era.yearStart)}
                    onChange={(event) => updateEra(index, "yearStart", event.target.value)}
                    className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                  />
                </Field>
                <Field label="Año final">
                  <input
                    type="number"
                    value={String(era.yearEnd)}
                    onChange={(event) => updateEra(index, "yearEnd", event.target.value)}
                    className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                  />
                </Field>
                <Field label="Tema" className="md:col-span-2">
                  <input
                    value={era.theme}
                    onChange={(event) => updateEra(index, "theme", event.target.value)}
                    className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                  />
                </Field>
                <Field label="Color">
                  <input
                    value={era.color}
                    onChange={(event) => updateEra(index, "color", event.target.value)}
                    className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                  />
                </Field>
              </div>

              <Field label="Descripción" className="mt-4">
                <textarea
                  value={era.description}
                  onChange={(event) => updateEra(index, "description", event.target.value)}
                  className="min-h-24 w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <section className="wiki-paper p-5 md:p-6">
          <div className="mb-5">
            <h2 className="font-heading text-2xl">Categorías</h2>
          </div>
          <div className="space-y-4">
            {config.categories.map((category, index) => (
              <div key={category.slug} className="rounded-sm border border-wiki-border bg-white p-4">
                <div className="text-sm text-wiki-muted">Slug fijo: {category.slug}</div>
                <div className="mt-4 grid gap-4">
                  <Field label="Nombre">
                    <input
                      value={category.name}
                      onChange={(event) => updateCategory(index, "name", event.target.value)}
                      className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                    />
                  </Field>
                  <Field label="Ícono">
                    <input
                      value={category.icon ?? ""}
                      onChange={(event) => updateCategory(index, "icon", event.target.value)}
                      className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                    />
                  </Field>
                  <Field label="Descripción">
                    <textarea
                      value={category.description}
                      onChange={(event) => updateCategory(index, "description", event.target.value)}
                      className="min-h-24 w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="wiki-paper p-5 md:p-6">
          <div className="mb-5">
            <h2 className="font-heading text-2xl">Bloques</h2>
          </div>
          <div className="space-y-4">
            {config.blocs.map((bloc, index) => (
              <div key={bloc.slug} className="rounded-sm border border-wiki-border bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm text-wiki-muted">Slug fijo: {bloc.slug}</div>
                  <div
                    className="h-8 w-8 rounded border border-wiki-border"
                    style={{ backgroundColor: bloc.color }}
                    aria-hidden="true"
                  />
                </div>
                <div className="grid gap-4">
                  <Field label="Nombre">
                    <input
                      value={bloc.name}
                      onChange={(event) => updateBloc(index, "name", event.target.value)}
                      className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                    />
                  </Field>
                  <Field label="Color">
                    <input
                      value={bloc.color}
                      onChange={(event) => updateBloc(index, "color", event.target.value)}
                      className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                    />
                  </Field>
                  <Field label="Resumen">
                    <textarea
                      value={bloc.summary}
                      onChange={(event) => updateBloc(index, "summary", event.target.value)}
                      className="min-h-24 w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <CopySection
        title="Shell y navegación"
        description="Título del sitio, navegación lateral y buscador superior."
        fields={shellFields}
        sectionKey="shell"
        state={config.copy}
        onChange={updateCopy}
      />
      <CopySection
        title="Portada"
        description="Textos visibles del hero, cronología, bloques y directorio."
        fields={homeFields}
        sectionKey="home"
        state={config.copy}
        onChange={updateCopy}
      />
      <CopySection
        title="Timeline"
        description="Cabecera, filtros y mensajes de la vista cronológica."
        fields={timelineFields}
        sectionKey="timeline"
        state={config.copy}
        onChange={updateCopy}
      />
      <CopySection
        title="Búsqueda"
        description="Textos de la página de búsqueda. Usa {{query}} dentro del template de sin resultados."
        fields={searchFields}
        sectionKey="search"
        state={config.copy}
        onChange={updateCopy}
      />
      <CopySection
        title="Países"
        description="Cabecera y textos de la matriz pública de países."
        fields={countriesFields}
        sectionKey="countries"
        state={config.copy}
        onChange={updateCopy}
      />
      <CopySection
        title="Ficha de País"
        description="Títulos y mensajes visibles en cada ficha pública de país."
        fields={countryPageFields}
        sectionKey="countryPage"
        state={config.copy}
        onChange={updateCopy}
      />
      <CopySection
        title="Scorecard de País"
        description="Labels del scorecard e historial de snapshots."
        fields={countryScorecardFields}
        sectionKey="countryScorecard"
        state={config.copy}
        onChange={updateCopy}
      />
      <CopySection
        title="Matriz de Países"
        description="Texto inferior de la tabla de presencia institucional."
        fields={countryPresenceBoardFields}
        sectionKey="countryPresenceBoard"
        state={config.copy}
        onChange={updateCopy}
      />
      <section className="grid gap-6 xl:grid-cols-3">
        <CopySection
          title="Página de Era"
          fields={eraPageFields}
          sectionKey="eraPage"
          state={config.copy}
          onChange={updateCopy}
        />
        <CopySection
          title="Página de Categoría"
          fields={categoryPageFields}
          sectionKey="categoryPage"
          state={config.copy}
          onChange={updateCopy}
        />
        <CopySection
          title="Página de Artículo"
          fields={articlePageFields}
          sectionKey="articlePage"
          state={config.copy}
          onChange={updateCopy}
        />
      </section>
    </form>
  );
}

function CopySection({
  title,
  description,
  fields,
  sectionKey,
  state,
  onChange
}: {
  title: string;
  description?: string;
  fields: CopyField[];
  sectionKey: keyof PublicWikiCopy;
  state: PublicWikiCopy;
  onChange: (section: keyof PublicWikiCopy, key: string, value: string) => void;
}) {
  const section = (state[sectionKey] as unknown) as Record<string, string>;

  return (
    <section className="wiki-paper p-5 md:p-6">
      <div className="mb-5">
        <h2 className="font-heading text-2xl">{title}</h2>
        {description ? <p className="mt-2 text-sm text-wiki-muted">{description}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <Field
            key={`${String(sectionKey)}-${field.key}`}
            label={field.label}
            className={field.multiline ? "md:col-span-2" : undefined}
          >
            {field.multiline ? (
              <textarea
                value={section[field.key] ?? ""}
                rows={field.rows ?? 3}
                onChange={(event) => onChange(sectionKey, field.key, event.target.value)}
                className="min-h-24 w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              />
            ) : (
              <input
                value={section[field.key] ?? ""}
                onChange={(event) => onChange(sectionKey, field.key, event.target.value)}
                className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              />
            )}
          </Field>
        ))}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  className
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <div className="mb-1 text-sm font-medium text-wiki-text">{label}</div>
      {children}
    </label>
  );
}

function Notice({
  children,
  tone
}: {
  children: ReactNode;
  tone: "success" | "error";
}) {
  return (
    <div
      className={`mt-4 rounded-sm border px-3 py-2 text-sm ${
        tone === "success"
          ? "border-[#88b49a] bg-[#eef8f1] text-[#234331]"
          : "border-[#c48787] bg-[#fff1f1] text-[#6f2323]"
      }`}
    >
      {children}
    </div>
  );
}
