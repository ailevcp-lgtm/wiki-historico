import type { Article, Bloc, Category, Country, TimelineEra } from "@/types/wiki";
import { publicBlocDefinitions } from "@/lib/bloc-profiles";

export const eras: TimelineEra[] = [
  {
    slug: "era-1",
    number: 1,
    name: "El Mundo que Resiste",
    yearStart: 2026,
    yearEnd: 2032,
    theme: "Crisis encadenadas y pactos de supervivencia",
    description:
      "Los primeros años del escenario histórico futurista combinan emergencias climáticas, presión migratoria y nuevos acuerdos funcionales.",
    color: "#5A7FA8"
  },
  {
    slug: "era-2",
    number: 2,
    name: "Arquitecturas de Bloque",
    yearStart: 2033,
    yearEnd: 2050,
    theme: "Se consolidan polos regionales con reglas y soberanías propias",
    description:
      "Los estados dejan de actuar de forma aislada y aparecen alianzas de recursos, tecnología y seguridad alimentaria.",
    color: "#748067"
  },
  {
    slug: "era-3",
    number: 3,
    name: "Soberanías Adaptativas",
    yearStart: 2051,
    yearEnd: 2075,
    theme: "La gobernanza se vuelve híbrida y experimental",
    description:
      "El planeta entra en una etapa de innovación institucional donde los bloques crean reglas cruzadas para sostener estabilidad.",
    color: "#8E6F56"
  },
  {
    slug: "era-4",
    number: 4,
    name: "La Negociación del Futuro",
    yearStart: 2076,
    yearEnd: 2100,
    theme: "Las potencias funcionales disputan el derecho político a definir el siglo XXII",
    description:
      "Las últimas décadas concentran la tensión entre legitimidad, eficiencia y justicia intergeneracional.",
    color: "#7B4F62"
  }
];

export const categories: Category[] = [
  {
    slug: "eventos-y-crisis",
    name: "Eventos y Crisis",
    description: "Choques climáticos, logísticos o políticos que alteran la línea histórica.",
    icon: "⛈"
  },
  {
    slug: "tratados",
    name: "Tratados",
    description: "Acuerdos formales que reordenan instituciones, fronteras o reglas de cooperación.",
    icon: "📜"
  },
  {
    slug: "bloques-y-actores",
    name: "Bloques y Actores",
    description: "Organizaciones, coaliciones y bloques de poder del escenario histórico futurista.",
    icon: "🏛"
  },
  {
    slug: "tecnologia-y-control",
    name: "Tecnología y Control",
    description: "Infraestructuras críticas, plataformas y doctrinas técnicas que reorganizan la autoridad.",
    icon: "⚙"
  },
  {
    slug: "cumbre-2100",
    name: "Cumbre 2100",
    description: "Entradas conectadas con el evento final y el debate sobre el derecho al futuro.",
    icon: "🕰"
  }
];

export const blocs: Bloc[] = publicBlocDefinitions.map(({ longDescription: _longDescription, characteristics: _characteristics, ...bloc }) => bloc);

export const articles: Article[] = [
  {
    slug: "crisis-del-litio-andino",
    title: "Crisis del Litio Andino",
    type: "event",
    summary:
      "Conflicto diplomático y logístico por el control de corredores de litio entre 2028 y 2029.",
    eraSlug: "era-1",
    hitoId: "H-003",
    yearStart: 2028,
    yearEnd: 2029,
    categorySlugs: ["eventos-y-crisis", "tecnologia-y-control"],
    relatedSlugs: ["pacto-de-cordoba-2031", "tecnopolis"],
    blocSlugs: ["agro-energetico", "tecnopolis"],
    imageUrl: "/images/litio-andino.svg",
    status: "published",
    author: "Equipo editorial SEA",
    featured: true,
    infobox: {
      type: "event",
      date: "Marzo 2028 - Enero 2029",
      location: "Corredores andinos del Cono Sur",
      event_type: "Crisis de recursos",
      casualties: "Bajo impacto militar directo",
      consequences: "Militarizacion parcial de infraestructura y nuevo pacto regional"
    },
    content: `
## Contexto

La disputa por el litio andino fue el primer episodio que hizo visible el agotamiento del modelo de extracción sin coordinación regional. Distintos actores comenzaron a disputar acceso a nodos de refinación, pasos bioceánicos y líneas de transmisión.

En los informes posteriores, el episodio aparece conectado con [[pacto-de-cordoba-2031]] y con la expansión temprana de [[tecnopolis]] como actor técnico.

## Desarrollo

- Los gobiernos provinciales exigieron mayor participación sobre regalías.
- Las plataformas logísticas privadas condicionaron el transporte a contratos de seguridad.
- Se intentó crear una [[autoridad-del-agua-del-sur|Autoridad del Agua del Sur]], pero nunca logró institucionalizarse.

| Actor | Objetivo |
| --- | --- |
| Estados nacionales | Recuperar margen regulatorio |
| Consorcios energéticos | Asegurar estabilidad contractual |
| Bloques emergentes | Reordenar la cadena de valor |

## Consecuencias

La crisis aceleró tres procesos: cooperación entre productores, vigilancia sobre infraestructura crítica y rediseño de los pactos extractivos.

> "El litio no detonó una guerra clásica; detonó una negociación de soberanías", señalaron crónicas posteriores de la época.
`
  },
  {
    slug: "pacto-de-cordoba-2031",
    title: "Pacto de Córdoba",
    type: "treaty",
    summary:
      "Tratado regional que creó un régimen común para infraestructura crítica, refinación y circulación de minerales estratégicos.",
    eraSlug: "era-1",
    hitoId: "H-005",
    yearStart: 2031,
    yearEnd: 2031,
    categorySlugs: ["tratados", "bloques-y-actores"],
    relatedSlugs: ["crisis-del-litio-andino", "tecnopolis"],
    blocSlugs: ["agro-energetico"],
    imageUrl: "/images/pacto-cordoba.svg",
    status: "published",
    author: "Equipo editorial SEA",
    infobox: {
      type: "treaty",
      date: "17 de septiembre de 2031",
      location: "Cordoba, region austral",
      signatories: "12 estados y 4 autoridades subnacionales",
      treaty_type: "Acuerdo regional de infraestructura",
      result: "Creacion de un régimen común de exportación y trazabilidad",
      status: "Vigente"
    },
    content: `
## Firma y contexto

El Pacto de Córdoba surgió tras la [[crisis-del-litio-andino]] para frenar la competencia desordenada entre corredores de exportación.

## Clausulas principales

1. Registro compartido de extracción.
2. Fondo para reparación ambiental.
3. Mecanismo de arbitraje técnico.
4. Trazabilidad obligatoria de embarques estratégicos.

## Impacto político

El pacto fortaleció a los actores del bloque [[agro-energetico|Agro-Energético]] y estableció un precedente para futuras coordinaciones multilaterales.
`
  },
  {
    slug: "tecnopolis",
    title: "Tecnópolis",
    type: "bloc",
    summary:
      "Bloque funcional de alta capacidad técnica que transformó la legitimidad política en métricas de resiliencia y eficiencia.",
    eraSlug: "era-2",
    hitoId: "H-011",
    yearStart: 2038,
    yearEnd: 2100,
    categorySlugs: ["bloques-y-actores", "tecnologia-y-control"],
    relatedSlugs: ["infraestructura-de-sombra", "cumbre-del-patio-2100"],
    blocSlugs: ["tecnopolis"],
    imageUrl: "/images/tecnopolis.svg",
    status: "published",
    author: "Equipo editorial SEA",
    infobox: {
      type: "organization",
      founded: "2038",
      headquarters: "Red distribuida de nodos urbanos",
      leader: "Consejo de Coordinacion Operativa",
      ideology: "Gobernanza tecnofuncional",
      members: "Ciudades, estados y consorcios asociados",
      bloc: "Tecnopolis",
      motto: "Gestionar es anticipar"
    },
    content: `
## Origen

Tecnópolis no nació como un estado ni como una organización internacional clásica. Fue una red de cooperación técnica que ofrecía capacidad operativa donde los gobiernos ya no podían sostener servicios complejos por sí solos.

## Expansión

Su crecimiento estuvo vinculado a doctrinas como [[infraestructura-de-sombra]], que proponían resiliencia descentralizada para energía, agua y comunicaciones.

## Críticas

Sus detractores argumentaron que Tecnópolis desplazaba la legitimidad democrática hacia métricas opacas de desempeño institucional.
`
  },
  {
    slug: "infraestructura-de-sombra",
    title: "Infraestructura de Sombra",
    type: "technology",
    summary:
      "Doctrina técnica que promovió redes redundantes, modulares y discretas para sostener servicios críticos bajo estrés sistémico.",
    eraSlug: "era-2",
    hitoId: "H-014",
    yearStart: 2042,
    yearEnd: 2048,
    categorySlugs: ["tecnologia-y-control"],
    relatedSlugs: ["tecnopolis", "cumbre-del-patio-2100"],
    blocSlugs: ["tecnopolis"],
    status: "published",
    author: "Equipo editorial SEA",
    infobox: {
      type: "technology",
      founded: "2042",
      location: "Multiples laboratorios civicos",
      consequences: "Reduccion del riesgo de colapso sistémico por nodos únicos"
    },
    content: `
## Definicion

La infraestructura de sombra describe el despliegue de servicios redundantes que pueden activarse cuando las redes oficiales pierden continuidad.

## Componentes

- Microredes energéticas.
- Reservas distribuidas de agua.
- Backbones de datos autónomos.
- Protocolos manuales de continuidad institucional.

## Legado

La doctrina fue central para que [[tecnopolis]] ganara legitimidad operativa en las décadas siguientes.
`
  },
  {
    slug: "cumbre-del-patio-2100",
    title: "Cumbre del Patio 2100",
    type: "summit",
    summary:
      "Instancia final de negociación donde los bloques del sistema discuten quién tiene derecho a definir el futuro político del siglo XXII.",
    eraSlug: "era-4",
    hitoId: "H-027",
    yearStart: 2100,
    yearEnd: 2100,
    categorySlugs: ["cumbre-2100", "bloques-y-actores"],
    relatedSlugs: ["tecnopolis", "pacto-de-cordoba-2031"],
    blocSlugs: ["tecnopolis", "confederacion", "agro-energetico", "vulnerables"],
    imageUrl: "/images/cumbre-2100.svg",
    status: "published",
    author: "Equipo editorial SEA",
    infobox: {
      type: "event",
      date: "Octubre de 2100",
      location: "Patio de deliberacion neutral",
      event_type: "Cumbre multibloque",
      consequences: "Debate fundacional sobre legitimidad y herencia institucional"
    },
    content: `
## Planteo central

La Cumbre del Patio 2100 organiza el conflicto político final del modelo histórico futurista: quién decide en nombre del futuro y con qué legitimidad.

## Actores en debate

- [[tecnopolis]]
- [[confederacion|Confederación]]
- [[agro-energetico|Bloque Agro-Energético]]
- [[vulnerables|Coalición de Vulnerables]]

## Pregunta rectora

La consigna que estructura la deliberación es simple y dura: **¿quién tiene derecho al futuro?**
`
  }
];

export const countries: Country[] = [
  {
    slug: "argentina",
    name: "Argentina",
    bloc: "agro-energetico",
    summary:
      "Actor pivote en alimentos, agua dulce y minerales estratégicos dentro del reordenamiento regional sudamericano.",
    profileMarkdown: `
## Perfil general

Argentina emerge como un actor de intermediación entre la seguridad alimentaria y la geopolítica de recursos.

## Tendencia

Oscila entre estrategias soberanistas y pactos funcionales de bloque.
`,
    scores: [
      {
        eraSlug: "era-1",
        hitoId: "H-003",
        climateExposure: 3,
        stateCapacity: 3,
        powerResources: 5,
        techDependency: 4,
        demographicPressure: 2,
        socialCohesion: 3,
        economicVulnerability: 4
      }
    ]
  }
];
