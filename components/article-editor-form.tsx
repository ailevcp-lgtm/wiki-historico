"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import type { Article, ArticleType, Category, TimelineEra } from "@/types/wiki";

const articleTypes: ArticleType[] = [
  "event",
  "organization",
  "treaty",
  "technology",
  "geography",
  "society",
  "summit",
  "bloc",
  "conflict"
];

interface ArticleEditorFormProps {
  categories: Category[];
  eras: TimelineEra[];
  initialArticle?: Article;
}

export function ArticleEditorForm({
  categories,
  eras,
  initialArticle
}: ArticleEditorFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialArticle);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState(initialArticle?.title ?? "");
  const [slug, setSlug] = useState(initialArticle?.slug ?? "");
  const [type, setType] = useState<ArticleType>(initialArticle?.type ?? "event");
  const [summary, setSummary] = useState(initialArticle?.summary ?? "");
  const [content, setContent] = useState(initialArticle?.content ?? "");
  const [eraSlug, setEraSlug] = useState(initialArticle?.eraSlug ?? "");
  const [hitoId, setHitoId] = useState(initialArticle?.hitoId ?? "");
  const [yearStart, setYearStart] = useState(initialArticle?.yearStart?.toString() ?? "");
  const [yearEnd, setYearEnd] = useState(initialArticle?.yearEnd?.toString() ?? "");
  const [imageUrl, setImageUrl] = useState(initialArticle?.imageUrl ?? "");
  const [author, setAuthor] = useState(initialArticle?.author ?? "");
  const [featured, setFeatured] = useState(Boolean(initialArticle?.featured));
  const [status, setStatus] = useState<Article["status"]>(initialArticle?.status ?? "draft");
  const [categorySlugs, setCategorySlugs] = useState(initialArticle?.categorySlugs.join(", ") ?? "");
  const [relatedSlugs, setRelatedSlugs] = useState(initialArticle?.relatedSlugs.join(", ") ?? "");
  const [blocSlugs, setBlocSlugs] = useState(initialArticle?.blocSlugs?.join(", ") ?? "");
  const [infoboxText, setInfoboxText] = useState(
    initialArticle?.infobox ? JSON.stringify(initialArticle.infobox, null, 2) : ""
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    let infobox: Article["infobox"] | undefined;

    if (infoboxText.trim()) {
      try {
        infobox = JSON.parse(infoboxText) as Article["infobox"];
      } catch {
        setError("El infobox debe ser un JSON válido.");
        return;
      }
    }

    const payload: Article = {
      slug: slug.trim(),
      title: title.trim(),
      type,
      summary: summary.trim(),
      content,
      infobox,
      categorySlugs: normalizeCommaList(categorySlugs),
      relatedSlugs: normalizeCommaList(relatedSlugs),
      blocSlugs: normalizeCommaList(blocSlugs),
      eraSlug: eraSlug || undefined,
      hitoId: hitoId.trim() || undefined,
      yearStart: yearStart ? Number(yearStart) : undefined,
      yearEnd: yearEnd ? Number(yearEnd) : undefined,
      imageUrl: imageUrl.trim() || undefined,
      status,
      author: author.trim() || undefined,
      featured
    };

    const endpoint = isEdit ? `/api/editor/articles/${initialArticle?.slug}` : "/api/editor/articles";
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responsePayload = (await response.json()) as { error?: string; slug?: string };

      if (!response.ok) {
        setError(responsePayload.error ?? "No se pudo guardar el artículo.");
        return;
      }

      setMessage("Artículo guardado.");
      startTransition(() => {
        router.push(`/admin/articles/${responsePayload.slug ?? payload.slug}`);
        router.refresh();
      });
    } catch {
      setError("Falló el guardado del artículo.");
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="wiki-paper p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Editor de artículos</p>
            <h1 className="wiki-page-title mt-2">
              {isEdit ? "Editar artículo" : "Nuevo artículo"}
            </h1>
          </div>
          {isEdit && initialArticle?.status === "published" ? (
            <Link href={`/article/${initialArticle.slug}`} className="wiki-link text-sm">
              Ver versión pública
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Título">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              required
            />
          </Field>

          <Field label="Slug">
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2 disabled:bg-wiki-page"
              required
              readOnly={isEdit}
            />
          </Field>

          <Field label="Tipo">
            <select
              value={type}
              onChange={(event) => setType(event.target.value as ArticleType)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
            >
              {articleTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Estado">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as Article["status"])}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
            >
              <option value="draft">draft</option>
              <option value="review">review</option>
              <option value="published">published</option>
            </select>
          </Field>

          <Field label="Era">
            <select
              value={eraSlug}
              onChange={(event) => setEraSlug(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
            >
              <option value="">Sin era</option>
              {eras.map((era) => (
                <option key={era.slug} value={era.slug}>
                  Era {era.number}: {era.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Hito ID">
            <input
              value={hitoId}
              onChange={(event) => setHitoId(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              placeholder="H-001"
            />
          </Field>

          <Field label="Año inicio">
            <input
              type="number"
              value={yearStart}
              onChange={(event) => setYearStart(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              inputMode="numeric"
              min={0}
            />
          </Field>

          <Field label="Año fin">
            <input
              type="number"
              value={yearEnd}
              onChange={(event) => setYearEnd(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              inputMode="numeric"
              min={0}
            />
          </Field>

          <Field label="Autor responsable">
            <input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
            />
          </Field>

          <Field label="Imagen URL">
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
              placeholder="https://... o /images/..."
            />
          </Field>
        </div>

        <Field className="mt-4" label="Resumen">
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="min-h-24 w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
          />
        </Field>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Categorías (separadas por coma)">
            <input
              list="category-options"
              value={categorySlugs}
              onChange={(event) => setCategorySlugs(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
            />
          </Field>

          <Field label="Relacionados (slugs, separados por coma)">
            <input
              value={relatedSlugs}
              onChange={(event) => setRelatedSlugs(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
            />
          </Field>

          <Field label="Bloques asociados (slugs, separados por coma)">
            <input
              value={blocSlugs}
              onChange={(event) => setBlocSlugs(event.target.value)}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
            />
          </Field>

          <label className="flex items-center gap-3 rounded-sm border border-wiki-border bg-wiki-page px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
            />
            Marcar como artículo destacado
          </label>
        </div>

        <datalist id="category-options">
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </datalist>
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <h2 className="font-heading text-2xl">Markdown del artículo</h2>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="mt-4 min-h-[420px] w-full rounded-sm border border-wiki-border bg-white px-3 py-3 font-mono text-sm leading-6"
          required
        />
      </section>

      <section className="wiki-paper p-5 md:p-6">
        <h2 className="font-heading text-2xl">Infobox JSON</h2>
        <p className="mt-2 text-sm text-wiki-muted">
          Usa un objeto JSON válido. Ejemplo: {`{"type":"event","date":"2030"}`}.
        </p>
        <textarea
          value={infoboxText}
          onChange={(event) => setInfoboxText(event.target.value)}
          className="mt-4 min-h-[220px] w-full rounded-sm border border-wiki-border bg-white px-3 py-3 font-mono text-sm leading-6"
        />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar artículo"}
        </button>
        <Link href="/admin/articles" className="wiki-link text-sm">
          Volver a publicaciones
        </Link>
      </div>

      {error ? <p className="text-sm font-semibold text-wiki-red">{error}</p> : null}
      {message ? <p className="text-sm text-wiki-muted">{message}</p> : null}
    </form>
  );
}

function Field({
  children,
  className = "",
  label
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-wiki-muted">{label}</span>
      {children}
    </label>
  );
}

function normalizeCommaList(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}
