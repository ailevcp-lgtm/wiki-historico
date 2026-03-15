import Link from "next/link";

import { ArticleStatusForm } from "@/components/article-status-form";
import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { requireEditorPageAccess } from "@/lib/editor/auth";
import { getAllArticles } from "@/lib/repository";
import { formatYearRange, normalizeQueryParam } from "@/lib/utils";

export default async function AdminArticlesPage({
  searchParams
}: {
  searchParams?: Promise<{ slug?: string | string[] }>;
}) {
  const access = await requireEditorPageAccess("/admin/articles");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedSlug = normalizeQueryParam(resolvedSearchParams?.slug);
  const articles = await getAllArticles();

  return (
    <section className="space-y-6">
      <EditorAccessNotice access={access} />

      <header className="wiki-paper p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Workflow editorial</p>
            <h1 className="wiki-page-title mt-2">Estados de artículos</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
              Los artículos promovidos desde importación entran aquí en estado <code>review</code>.
              Desde esta mesa editorial puedes publicarlos, dejarlos en borrador o editar su contenido.
            </p>
          </div>
          <Link
            href="/admin/articles/new"
            className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold"
          >
            Nuevo artículo
          </Link>
        </div>
      </header>

      <section className="wiki-paper p-5 md:p-6">
        <div className="space-y-4">
          {articles.length === 0 ? (
            <p className="text-wiki-muted">Todavía no hay artículos cargados.</p>
          ) : (
            articles.map((article) => (
              <article
                key={article.slug}
                className={`rounded-sm border p-4 ${
                  selectedSlug === article.slug
                    ? "border-wiki-blue bg-[#f5faff]"
                    : "border-wiki-border bg-white"
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  <span className="wiki-badge">{article.status}</span>
                  <span className="wiki-badge">{article.type}</span>
                  <span className="wiki-badge">{formatYearRange(article.yearStart, article.yearEnd)}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <h2 className="font-heading text-2xl">{article.title}</h2>
                    <p className="mt-2 text-wiki-muted">{article.summary}</p>
                    <p className="mt-2 text-sm text-wiki-muted">
                      <code>{article.slug}</code>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <Link href={`/admin/articles/${article.slug}`} className="wiki-link">
                        Editar contenido
                      </Link>
                      {article.status === "published" ? (
                        <Link href={`/article/${article.slug}`} className="wiki-link">
                          Ver artículo público
                        </Link>
                      ) : (
                        <span className="text-wiki-muted">
                          Aún no visible públicamente mientras no esté en <code>published</code>.
                        </span>
                      )}
                    </div>
                  </div>

                  <ArticleStatusForm currentStatus={article.status} slug={article.slug} />
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
