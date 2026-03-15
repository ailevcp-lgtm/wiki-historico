import { redirect } from "next/navigation";

export default async function EditorArticlesPage({
  searchParams
}: {
  searchParams?: Promise<{ slug?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const slug = Array.isArray(resolvedSearchParams?.slug)
    ? resolvedSearchParams?.slug[0]
    : resolvedSearchParams?.slug;
  redirect(slug ? `/admin/articles?slug=${encodeURIComponent(slug)}` : "/admin/articles");
}
