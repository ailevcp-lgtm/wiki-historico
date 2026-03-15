import { notFound } from "next/navigation";

import { ArticleEditorForm } from "@/components/article-editor-form";
import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { requireEditorPageAccess } from "@/lib/editor/auth";
import { getEditableArticleBySlug, getNavigationData } from "@/lib/repository";

export default async function AdminArticleDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const access = await requireEditorPageAccess("/admin/articles");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }

  const { slug } = await params;
  const article = await getEditableArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const navigation = getNavigationData();

  return (
    <section className="space-y-6">
      <EditorAccessNotice access={access} />
      <ArticleEditorForm
        categories={navigation.categories}
        eras={navigation.eras}
        initialArticle={article}
      />
    </section>
  );
}
