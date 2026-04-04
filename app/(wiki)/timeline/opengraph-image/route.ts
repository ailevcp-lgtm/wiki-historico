import { buildOgImage } from "@/lib/og";

export function GET() {
  return buildOgImage({
    eyebrow: "Cronología",
    title: "Timeline del escenario",
    description: "Hitos ordenados por era, tipo y bloque para explorar la wiki.",
    accentColor: "#d97706"
  });
}
