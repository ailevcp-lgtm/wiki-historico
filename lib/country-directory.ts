import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";

import { countryOrganDefinitions } from "@/lib/country-organs";
import { slugify } from "@/lib/utils";
import type { Country, CountryOrganSlug } from "@/types/wiki";

const csvFilePath = path.join(process.cwd(), "CSV", "Lista paises historico 2026 - Completa.csv");

const fallbackCountryNames = [
  "EEUUO",
  "Argentina",
  "La Nueva Judea (Israel)",
  "Mexico",
  "Reino Unido",
  "Italia (ultra religioso)",
  "España",
  "Liga Arabe (Tec + rel)",
  "Pakistán",
  "China",
  "Rusia",
  "Iran",
  "Egipto (Rel)",
  "Sudafrica (T d M)",
  "Republica Democratica del Congo (Tecn)",
  "EEUUE",
  "India",
  "Aether",
  "Umah",
  "Chad",
  "Alemania",
  "Francia",
  "Brasil",
  "Ucrania",
  "Turquia",
  "Chile",
  "Canada",
  "Somalia",
  "Japón",
  "Colombia",
  "Polonia"
] as const;

const organPresets: CountryOrganSlug[][] = [
  ["ag", "cdh", "csym"],
  ["ag", "cdh"],
  ["ag"]
];

export const getSeedCountries = cache(async (): Promise<Country[]> => {
  const countryNames = await readCountryNamesFromCsv();

  return countryNames.map((name, index) => ({
    slug: slugify(name),
    name,
    summary: buildSeedSummary(name, index),
    profileMarkdown: buildSeedProfile(name),
    organMemberships: getPresetByIndex(index),
    scores: []
  }));
});

export const getSeedCountryOrder = cache(async () => {
  const countries = await getSeedCountries();
  return new Map(countries.map((country, index) => [country.slug, index] as const));
});

function buildSeedSummary(name: string, index: number) {
  const labels = getPresetByIndex(index)
    .map((slug) => countryOrganDefinitions.find((organ) => organ.slug === slug)?.label ?? slug.toUpperCase())
    .join(", ");

  return `${name} figura en la matriz base de países del escenario con presencia en ${labels}.`;
}

function buildSeedProfile(name: string) {
  return `## Ficha base\n\n${name} fue incorporado desde la matriz inicial de países por órgano.\n\n## Pendiente editorial\n\nCompletar aquí el perfil narrativo, antecedentes y posición estratégica desde el panel admin.`;
}

function getPresetByIndex(index: number): CountryOrganSlug[] {
  if (index <= 14) {
    return organPresets[0];
  }

  if (index <= 24) {
    return organPresets[1];
  }

  return organPresets[2];
}

async function readCountryNamesFromCsv() {
  try {
    const content = await fs.readFile(csvFilePath, "utf8");
    const rows = content
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean);

    return rows
      .slice(1)
      .map((row) => row.split(",")[0]?.trim())
      .filter((value): value is string => Boolean(value));
  } catch {
    return [...fallbackCountryNames];
  }
}
