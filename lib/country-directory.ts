import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";

import { normalizeCountryOrganMemberships } from "@/lib/country-organs";
import { findCanonicalCountry } from "@/lib/import/country-normalization";
import { slugify } from "@/lib/utils";
import type { Country } from "@/types/wiki";

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

export const getSeedCountries = cache(async (): Promise<Country[]> => {
  const countryNames = await readCountryNamesFromCsv();
  const countries: Country[] = [];
  const seenSlugs = new Set<string>();

  for (const nameFromSource of countryNames) {
    const canonical = findCanonicalCountry(nameFromSource);
    const slug = canonical?.slug ?? slugify(nameFromSource);

    if (seenSlugs.has(slug)) {
      continue;
    }

    const name = canonical?.name ?? nameFromSource;
    seenSlugs.add(slug);
    countries.push({
      slug,
      name,
      summary: buildSeedSummary(name),
      profileMarkdown: buildSeedProfile(name),
      organMemberships: normalizeCountryOrganMemberships(canonical?.organMemberships),
      scores: []
    });
  }

  return countries;
});

export const getSeedCountryOrder = cache(async () => {
  const countries = await getSeedCountries();
  return new Map(countries.map((country, index) => [country.slug, index] as const));
});

function buildSeedSummary(name: string) {
  return `${name} figura en la matriz base de países del escenario y espera desarrollo editorial completo.`;
}

function buildSeedProfile(name: string) {
  return `## Ficha base\n\n${name} fue incorporado desde la matriz inicial de países.\n\n## Pendiente editorial\n\nCompletar aquí el perfil narrativo, antecedentes y posición estratégica desde el panel admin.`;
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
