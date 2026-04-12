import { findCanonicalCountry } from "@/lib/import/country-normalization";
import { slugify } from "@/lib/utils";
import type { Country } from "@/types/wiki";

const bundledFlagUrlByKey: Record<string, string> = {
  aether: "/Banderas/INVENTADAS/Aether Logo.png",
  argentina: "/Banderas/ACTUALES/argentina.svg",
  brasil: "/Banderas/ACTUALES/brasil.svg",
  canada: "/Banderas/ACTUALES/canada.svg",
  chile: "/Banderas/ACTUALES/chile.svg",
  china: "/Banderas/ACTUALES/china.svg",
  colombia: "/Banderas/ACTUALES/colombia.svg",
  "confederacion-del-congo-central": "/Banderas/INVENTADAS/Confederacion del Congo Central Bandera.png",
  "confederacion-germana": "/Banderas/INVENTADAS/Confederacion Germana Bandera.png",
  "confederacion-saheliana": "/Banderas/INVENTADAS/Confederacion Saheliana bandera.png",
  "estados-unidos-del-este": "/Banderas/INVENTADAS/EEUUE Bandera.png",
  "estados-unidos-del-oeste": "/Banderas/INVENTADAS/EEUUO Bandera.png",
  egipto: "/Banderas/ACTUALES/egipto.svg",
  espana: "/Banderas/ACTUALES/espana.svg",
  francia: "/Banderas/ACTUALES/francia.svg",
  india: "/Banderas/ACTUALES/india.svg",
  iran: "/Banderas/ACTUALES/iran.svg",
  italia: "/Banderas/ACTUALES/italia.svg",
  japon: "/Banderas/ACTUALES/japon.svg",
  "la-nueva-judea-israel": "/Banderas/INVENTADAS/Nueva judea bandera.png",
  "liga-arabe": "/Banderas/INVENTADAS/Liga Arabe Bandera.png",
  "liga-arabe-tec-rel": "/Banderas/INVENTADAS/Liga Arabe Bandera.png",
  "liga-balcanica": "/Banderas/INVENTADAS/Liga Balcanica Bandera.png",
  mexico: "/Banderas/ACTUALES/mexico.svg",
  "nueva-judea-israel": "/Banderas/INVENTADAS/Nueva judea bandera.png",
  pakistan: "/Banderas/ACTUALES/pakistan.svg",
  polonia: "/Banderas/ACTUALES/polonia.svg",
  "reino-unido": "/Banderas/ACTUALES/reino-unido.svg",
  rusia: "/Banderas/ACTUALES/rusia.svg",
  somalia: "/Banderas/ACTUALES/somalia.svg",
  sudafrica: "/Banderas/ACTUALES/sudafrica.svg",
  turquia: "/Banderas/ACTUALES/turquia.svg",
  ucrania: "/Banderas/ACTUALES/ucrania.svg",
  ummah: "/Banderas/INVENTADAS/Umah Logo.png"
};

const legacyRepresentativeUrlPattern = /\/images\/history-docs\/fichas-pais\//i;

export function getCountryFlagAssetKey(country: Pick<Country, "slug" | "name">) {
  const canonicalCountry = findCanonicalCountry(country.slug) ?? findCanonicalCountry(country.name);

  return canonicalCountry?.slug ?? slugify(country.name);
}

export function getBundledCountryFlagUrl(country: Pick<Country, "slug" | "name">) {
  return bundledFlagUrlByKey[getCountryFlagAssetKey(country)];
}

function isLegacyRepresentativeUrl(url?: string) {
  return Boolean(url && legacyRepresentativeUrlPattern.test(url));
}

export function resolveCountryFlagUrl(
  country: Pick<Country, "slug" | "name" | "flagUrl" | "representativeUrl">
) {
  if (country.flagUrl && !isLegacyRepresentativeUrl(country.flagUrl)) {
    return country.flagUrl;
  }

  return getBundledCountryFlagUrl(country);
}

export function resolveCountryRepresentativeUrl(
  country: Pick<Country, "flagUrl" | "representativeUrl">
) {
  if (country.representativeUrl) {
    return country.representativeUrl;
  }

  return isLegacyRepresentativeUrl(country.flagUrl) ? country.flagUrl : undefined;
}
