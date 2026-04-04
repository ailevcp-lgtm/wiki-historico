import { buildOgImage } from "@/lib/og";
import { getEraBySlug } from "@/lib/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  const era = await getEraBySlug(resolvedParams.slug);

  return buildOgImage({
    eyebrow: era ? `Era ${era.number}` : "Era",
    title: era ? era.name : "Histórico 2100",
    description: era
      ? `${era.yearStart}-${era.yearEnd} · ${era.theme}`
      : "Cronología del escenario histórico futurista.",
    accentColor: era?.color ?? "#2563eb"
  });
}
