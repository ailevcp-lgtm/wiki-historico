import { buildOgImage } from "@/lib/og";

export function GET() {
  return buildOgImage({
    eyebrow: "Cronología",
    title: "Línea del tiempo del escenario",
    description: "Hitos ordenados por era para explorar la wiki.",
    accentColor: "#d97706"
  });
}
