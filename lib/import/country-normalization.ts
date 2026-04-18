import { slugify } from "@/lib/utils";
import type { CountryOrganSlug } from "@/types/wiki";

export interface CanonicalCountryRecord {
  slug: string;
  name: string;
  aliases: string[];
  organMemberships?: CountryOrganSlug[];
  sourceMapFileName?: string;
}

type CanonicalCountrySeed = Omit<CanonicalCountryRecord, "slug"> & {
  slug?: string;
};

const canonicalCountrySeeds: CanonicalCountrySeed[] = [
  {
    slug: "aether",
    name: "AETHER",
    aliases: ["Aether", "Aether (Empresa)", "Aether (TEC)", "aether"],
    organMemberships: ["ag", "cdh"]
  },
  {
    slug: "argentina",
    name: "Argentina",
    aliases: ["ARGENTINA", "Argentina (MIXTO)"],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "Nueva Judea y Argetina.png"
  },
  {
    slug: "brasil",
    name: "Brasil",
    aliases: ["[Brasil]", "Brasil (REL)"],
    organMemberships: ["ag"],
    sourceMapFileName: "Brasil Mapa.png"
  },
  {
    slug: "canada",
    name: "Canadá",
    aliases: ["Canada", "Canada (MIXTO)"],
    organMemberships: ["ag"],
    sourceMapFileName: "Canada mapa.png"
  },
  {
    slug: "chile",
    name: "Chile",
    aliases: ["Chile (TEC)"],
    organMemberships: ["ag"],
    sourceMapFileName: "Chile mapa.png"
  },
  {
    slug: "china",
    name: "China",
    aliases: ["China (MIXTO)"],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "China Mapa.png"
  },
  {
    slug: "colombia",
    name: "Colombia",
    aliases: ["COLOMBIA", "Colombia (NARCO)"],
    organMemberships: ["ag"],
    sourceMapFileName: "Colombia Mapa.png"
  },
  {
    slug: "confederacion-del-congo-central",
    name: "Confederación del Congo Central",
    aliases: [
      "Confederación del Congo Central (CCC) (TEC)",
      "Republica Democratica del Congo",
      "RDC",
      "Republica Democratica del Congo (Tecn)"
    ],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "Confederación del Congo Central  Mapa.png"
  },
  {
    slug: "confederacion-germana",
    name: "Confederación Germana",
    aliases: ["Confederación Germana (MIXTO)", "Alemania"],
    organMemberships: ["ag"],
    sourceMapFileName: "Confederación Germana Mapa.png"
  },
  {
    slug: "confederacion-saheliana",
    name: "Confederación Saheliana",
    aliases: ["Confederación Saheliana (TEC)", "Chad"],
    organMemberships: ["ag"],
    sourceMapFileName: "Confederación Saheliana Mapa.png"
  },
  {
    slug: "estados-unidos-del-este",
    name: "Estados Unidos del Este",
    aliases: ["EEUUE", "EEUE", "EEUUE (MIXTO)"],
    organMemberships: ["ag", "cdh"],
    sourceMapFileName: "EEUUO Y EEUUE MAPA.png"
  },
  {
    slug: "estados-unidos-del-oeste",
    name: "Estados Unidos del Oeste",
    aliases: ["EEUUO", "EEUO", "EEUUO (TEC)"],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "EEUUO Y EEUUE MAPA.png"
  },
  {
    slug: "egipto",
    name: "Egipto",
    aliases: ["Egipto (Rel)"],
    organMemberships: ["ag", "csym"],
    sourceMapFileName: "Egipto Mapa.png"
  },
  {
    slug: "espana",
    name: "España",
    aliases: ["España (TEC)"],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "España Mapa.png"
  },
  {
    slug: "francia",
    name: "Francia",
    aliases: ["Francia (TEC)"],
    organMemberships: ["ag", "cdh"],
    sourceMapFileName: "Francia Mapa.png"
  },
  {
    slug: "india",
    name: "India",
    aliases: ["Indía", "India (REL)"],
    organMemberships: ["ag"],
    sourceMapFileName: "India Mapa.png"
  },
  {
    slug: "iran",
    name: "Irán",
    aliases: ["Iran", "Iran (REL)"],
    organMemberships: ["ag", "csym"],
    sourceMapFileName: "Irán Mapa.png"
  },
  {
    slug: "italia",
    name: "Italia",
    aliases: ["Italia (REL)", "Italia (ultra religioso)"],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "Italia Mapa.png"
  },
  {
    slug: "japon",
    name: "Japón",
    aliases: ["Japon", "Japón (TEC)"],
    organMemberships: ["ag"],
    sourceMapFileName: "Japón Mapa.png"
  },
  {
    slug: "nueva-judea-israel",
    name: "Nueva Judea/Israel",
    aliases: [
      "Israel",
      "La Nueva Judea (Israel)",
      "La Nueva Judea (Israel) (REL)",
      "La nueva judea",
      "La Nueva Judea",
      "Nueva Judea / Israel"
    ],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "Nueva Judea y Argetina.png"
  },
  {
    slug: "liga-arabe",
    name: "Liga Arabe",
    aliases: ["Liga Árabe", "Liga Arabe (REL + TEC)"],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "Liga Arabe Mapa.png"
  },
  {
    slug: "liga-balcanica",
    name: "Liga balcánica",
    aliases: ["Liga Balcanica", "Liga Balcanica (MIXTO)"],
    organMemberships: ["ag"],
    sourceMapFileName: "Liga balcanica Mapa.png"
  },
  {
    slug: "mexico",
    name: "México",
    aliases: ["Mexico", "Mexico (NARCO)"],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "Mexico Mapa.png"
  },
  {
    slug: "pakistan",
    name: "Pakistán",
    aliases: ["Pakistan", "Pakistán (TEC)"],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "Pakistan Mapa.png"
  },
  {
    slug: "reino-unido",
    name: "Reino Unido",
    aliases: ["Reino Unido (MIXTO)"],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "Reino Unido Mapa.png"
  },
  {
    slug: "rusia",
    name: "Rusia",
    aliases: ["Rusia (TEC)"],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "Rusia Mapa.png"
  },
  {
    slug: "somalia",
    name: "Somalia",
    aliases: ["Somalia (REL)"],
    organMemberships: ["ag"],
    sourceMapFileName: "Somalia Mapa.png"
  },
  {
    slug: "sudafrica",
    name: "Sudáfrica",
    aliases: ["Sudafrica", "Sudafrica (MIXTO)", "Sudafrica (T d M)"],
    organMemberships: ["ag", "cdh", "csym"],
    sourceMapFileName: "Sudafrica Mapa.png"
  },
  {
    slug: "turquia",
    name: "Turquía",
    aliases: ["Turquia", "Turquia (REL)"],
    organMemberships: ["ag"],
    sourceMapFileName: "Turquia Mapa.png"
  },
  {
    slug: "ucrania",
    name: "Ucrania",
    aliases: ["Ucrania (TEC)"],
    organMemberships: ["ag"],
    sourceMapFileName: "Ucrania Mapa.png"
  },
  {
    slug: "ummah",
    name: "Ummah",
    aliases: ["UMMAH", "Umah", "Umah (REL)", "Ummah (Confederación Ideológica)"],
    organMemberships: ["ag"]
  }
];

export const canonicalCountries: CanonicalCountryRecord[] = canonicalCountrySeeds.map((seed) => ({
  ...seed,
  slug: seed.slug ?? slugify(seed.name)
}));

const canonicalCountryBySlug = new Map(canonicalCountries.map((country) => [country.slug, country] as const));
const canonicalCountryByAlias = new Map<string, CanonicalCountryRecord>();
const canonicalCountriesByMapKey = new Map<string, CanonicalCountryRecord[]>();

for (const country of canonicalCountries) {
  for (const alias of [country.name, country.slug, ...country.aliases]) {
    const key = normalizeCountryIdentityKey(alias);

    if (!key || canonicalCountryByAlias.has(key)) {
      continue;
    }

    canonicalCountryByAlias.set(key, country);
  }

  if (!country.sourceMapFileName) {
    continue;
  }

  const mapKey = normalizeCountryIdentityKey(country.sourceMapFileName);
  const matchingCountries = canonicalCountriesByMapKey.get(mapKey) ?? [];

  matchingCountries.push(country);
  canonicalCountriesByMapKey.set(mapKey, matchingCountries);
}

export function listCanonicalCountries() {
  return canonicalCountries;
}

export function getCanonicalCountryBySlug(slug: string) {
  return canonicalCountryBySlug.get(slug);
}

export function findCanonicalCountry(value: string) {
  return canonicalCountryByAlias.get(normalizeCountryIdentityKey(value));
}

export function getCanonicalCountriesByMapFileName(fileName: string) {
  return canonicalCountriesByMapKey.get(normalizeCountryIdentityKey(fileName)) ?? [];
}

export function normalizeCountryIdentityKey(value: string) {
  return slugify(value.replace(/\.[^.]+$/, "").trim());
}
