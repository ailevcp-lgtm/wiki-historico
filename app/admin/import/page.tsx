import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { ImportPreviewClient } from "@/components/import-preview-client";
import { requireEditorPageAccess } from "@/lib/editor/auth";

export default async function AdminImportPage() {
  const access = await requireEditorPageAccess("/admin/import");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }

  return (
    <section className="space-y-6">
      <EditorAccessNotice access={access} />
      <ImportPreviewClient />
    </section>
  );
}
