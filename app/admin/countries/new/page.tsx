import { CountryEditorForm } from "@/components/country-editor-form";
import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { requireEditorPageAccess } from "@/lib/editor/auth";
import { getNavigationData } from "@/lib/repository";

export default async function AdminNewCountryPage() {
  const access = await requireEditorPageAccess("/admin/countries/new");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }

  const navigation = getNavigationData();

  return (
    <section className="space-y-6">
      <EditorAccessNotice access={access} />
      <CountryEditorForm blocs={navigation.blocs} eras={navigation.eras} />
    </section>
  );
}
