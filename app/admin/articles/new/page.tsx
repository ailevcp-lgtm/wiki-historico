import { ArticleEditorForm } from "@/components/article-editor-form";
import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { requireEditorPageAccess } from "@/lib/editor/auth";
import { getNavigationData } from "@/lib/repository";

export default async function AdminNewArticlePage() {
  const access = await requireEditorPageAccess("/admin/articles/new");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }

  const navigation = await getNavigationData();

  return (
    <section className="space-y-6">
      <EditorAccessNotice access={access} />
      <ArticleEditorForm categories={navigation.categories} eras={navigation.eras} />
    </section>
  );
}
