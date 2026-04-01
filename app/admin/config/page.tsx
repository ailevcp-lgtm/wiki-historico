import { SiteConfigEditor } from "@/components/site-config-editor";
import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { requireEditorPageAccess } from "@/lib/editor/auth";
import { getSiteConfig } from "@/lib/site-config/store";

export default async function AdminConfigPage() {
  const access = await requireEditorPageAccess("/admin/config");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }

  const config = await getSiteConfig();

  return (
    <section className="space-y-6">
      <EditorAccessNotice access={access} />
      <SiteConfigEditor initialConfig={config} />
    </section>
  );
}

