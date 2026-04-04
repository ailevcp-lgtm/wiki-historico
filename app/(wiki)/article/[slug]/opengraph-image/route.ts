import { notFound } from "next/navigation";

import { buildOgImage } from "@/lib/og";
import { getArticleBySlug } from "@/lib/repository";
import { sanitizeMetaDescription } from "@/lib/seo";
import { humanizeSlug } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  const article = await getArticleBySlug(resolvedParams.slug);

  if (!article) {
    notFound();
  }

  const description = sanitizeMetaDescription(article.summary);
  const accentColor = article.type === "event" ? "#60a5fa" : "#8b5cf6";

  return buildOgImage({
    eyebrow: "Artículo de la wiki",
    title: article.title,
    description,
    accentColor,
    domainLabel: `${humanizeSlug(article.type)} · wiki.aile.com.ar`
  });
}
