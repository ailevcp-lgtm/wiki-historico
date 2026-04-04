import { buildOgImage } from "@/lib/og";

export function GET() {
  return buildOgImage({
    eyebrow: "Histórico 2100",
    title: "Wiki AILE",
    description: "Portada, países, eras y cronologías del escenario histórico futurista.",
    accentColor: "#2563eb"
  });
}
