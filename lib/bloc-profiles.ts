import type { Bloc, Country } from "@/types/wiki";

export const publicBlocDefinitions: Array<
  Bloc & {
    longDescription: string;
    characteristics: string[];
  }
> = [
  {
    slug: "tecnologicos",
    name: "Tecnológicos",
    summary: "Estados que priorizan la tecnología como base del orden social y estatal.",
    color: "#DCEBFA",
    longDescription:
      "Estados que dependen de la tecnología para suplir necesidades humanas. Consideran que su avance y dependencia pueden desarrollar un mundo más previsible y eficiente, con planificación estatal robusta y menor incertidumbre.",
    characteristics: [
      "Alta confianza en sistemas técnicos para gestión pública.",
      "Planificación estatal basada en datos y previsión.",
      "Visión de estabilidad apoyada en infraestructura tecnológica."
    ]
  },
  {
    slug: "mixto",
    name: "Mixto",
    summary: "Estados de gran base territorial y de recursos, con enfoque pragmático.",
    color: "#F6E7D7",
    longDescription:
      "Estados, en general con amplia extensión territorial, capaces de sustentar y exportar materias primas. Defienden el uso de la tecnología para maximizar beneficios económicos y de planeación personal, pero conservan cautela por el impacto histórico de la tecnología en la guerra y por el riesgo de pérdida de control estatal.",
    characteristics: [
      "Capacidad de producción y exportación de recursos estratégicos.",
      "Uso instrumental de tecnología con enfoque económico.",
      "Equilibrio entre modernización técnica y soberanía estatal."
    ]
  },
  {
    slug: "religiosos",
    name: "Religiosos",
    summary: "Estados que limitan la tecnología al plano funcional y sostienen un marco espiritual.",
    color: "#E7EBD6",
    longDescription:
      "Estados que consideran a las tecnologías como herramientas para necesidades básicas, pero buscan distanciarlas de la planeación personal y estatal por entender que ese rol contradice una visión del mundo donde el desarrollo humano debe sostenerse principalmente en la acción propia y principios religiosos.",
    characteristics: [
      "Uso acotado de la tecnología para funciones básicas.",
      "Priorización de valores espirituales sobre la tecnificación total.",
      "Resistencia a la planificación personal o estatal dirigida por sistemas técnicos."
    ]
  }
];

const legacyBlocMap: Record<string, (typeof publicBlocDefinitions)[number]["slug"]> = {
  tecnologicos: "tecnologicos",
  tecnologico: "tecnologicos",
  tecnopolis: "tecnologicos",
  mixto: "mixto",
  agro: "mixto",
  "agro-energetico": "mixto",
  vulnerables: "mixto",
  religiosos: "religiosos",
  religioso: "religiosos",
  confederacion: "religiosos"
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeBlocSlug(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = normalizeText(value).trim().replace(/\s+/g, "-");
  return legacyBlocMap[normalized];
}

export function inferBlocFromCountry(country: Pick<Country, "bloc" | "name" | "summary" | "profileMarkdown">) {
  const mapped = normalizeBlocSlug(country.bloc);

  if (mapped) {
    return mapped;
  }

  const text = normalizeText(
    `${country.name} ${country.summary ?? ""} ${country.profileMarkdown ?? ""}`
  );

  if (/(relig|dios|ummah|ultra religioso|espiritual)/.test(text)) {
    return "religiosos";
  }

  if (/(mixto|materias primas|export|agro|territorial|recursos estrategicos)/.test(text)) {
    return "mixto";
  }

  if (/(tecnolog|aether|tecnopolis|dependencia tecnica|dependencia tecnologica)/.test(text)) {
    return "tecnologicos";
  }

  return undefined;
}

export function getBlocDefinitionBySlug(slug: string) {
  return publicBlocDefinitions.find((bloc) => bloc.slug === slug);
}
