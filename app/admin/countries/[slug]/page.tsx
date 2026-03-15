import { notFound } from "next/navigation";

import { CountryEditorForm } from "@/components/country-editor-form";
import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { requireEditorPageAccess } from "@/lib/editor/auth";
import { getEditableCountryBySlug, getNavigationData } from "@/lib/repository";

export default async function AdminCountryDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const access = await requireEditorPageAccess("/admin/countries");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }

  const { slug } = await params;
  const country = await getEditableCountryBySlug(slug);

  if (!country) {
    notFound();
  }

  const navigation = getNavigationData();

  return (
    <section className="space-y-6">
      <EditorAccessNotice access={access} />
      <CountryEditorForm
        blocs={navigation.blocs}
        eras={navigation.eras}
        initialCountry={country}
      />
    </section>
  );
}
