import { redirect } from "next/navigation";

export default async function EditorLoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const params = new URLSearchParams();
  if (resolvedSearchParams?.error) {
    params.set("error", resolvedSearchParams.error);
  }
  if (resolvedSearchParams?.next) {
    params.set("next", resolvedSearchParams.next);
  }
  redirect(`/admin/login${params.toString() ? `?${params.toString()}` : ""}`);
}
