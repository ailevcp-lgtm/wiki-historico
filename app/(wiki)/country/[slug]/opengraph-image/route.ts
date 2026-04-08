import { notFound } from "next/navigation";

import { buildOgImage } from "@/lib/og";
import { getCountryBySlug } from "@/lib/repository";
import { sanitizeMetaDescription } from "@/lib/seo";
import { humanizeSlug } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  const country = await getCountryBySlug(resolvedParams.slug);

  if (!country) {
    notFound();
  }

  const description = sanitizeMetaDescription(country.summary);
  const accentColor = pickAccentColor(country.bloc);

  return buildOgImage({
    eyebrow: "Ficha país",
    title: country.name,
    description,
    accentColor,
    domainLabel: `${country.bloc ? humanizeSlug(country.bloc) : "Países"} · wiki.aile.com.ar`
  });
}

function pickAccentColor(bloc?: string) {
  switch (bloc) {
    case "tecnologicos":
      return "#38bdf8";
    case "mixto":
      return "#f59e0b";
    case "religiosos":
      return "#22c55e";
    default:
      return "#2563eb";
  }
}
