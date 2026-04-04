import { buildOgImage } from "@/lib/og";

export function GET() {
  return buildOgImage({
    eyebrow: "Directorio",
    title: "Países y regiones",
    description: "Presencia institucional y fichas para compartir en WhatsApp y redes.",
    accentColor: "#0f766e"
  });
}
