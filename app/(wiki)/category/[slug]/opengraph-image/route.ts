import { buildOgImage } from "@/lib/og";
import { getCategoryBySlug } from "@/lib/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  const category = await getCategoryBySlug(resolvedParams.slug);

  return buildOgImage({
    eyebrow: "Categoría",
    title: category ? category.name : "Categoría",
    description: category?.description ?? "Entradas de la wiki agrupadas por tema y tipo.",
    accentColor: getCategoryAccentColor(resolvedParams.slug)
  });
}

function getCategoryAccentColor(slug: string) {
  switch (slug) {
    case "eventos-y-crisis":
      return "#b91c1c";
    case "tratados":
      return "#2563eb";
    case "bloques-y-actores":
      return "#0f766e";
    case "tecnologia-y-control":
      return "#7c2d12";
    case "cumbre-2100":
      return "#0f172a";
    default:
      return "#475569";
  }
}
