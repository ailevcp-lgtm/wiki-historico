import { blocs, categories, eras } from "@/lib/mock-data";
import type { PublicWikiCopy, WikiSiteConfig } from "@/types/wiki";

export const defaultPublicWikiCopy: PublicWikiCopy = {
  shell: {
    siteTitle: "Histórico 2100",
    siteTagline: "Wiki del escenario",
    searchPlaceholder: "Buscar artículos ",
    searchButtonLabel: "Buscar",
    navigationSectionTitle: "Navegación",
    homeLabel: "Portada",
    timelineLabel: "Timeline",
    searchLabel: "Búsqueda",
    countriesLabel: "Países",
    erasSectionTitle: "Eras",
    categoriesSectionTitle: "Categorías",
    blocsSectionTitle: "Bloques",
    eraLabelPrefix: "Era"
  },
  home: {
    heroEyebrow: "Modelo histórico futurista",
    heroTitle: "Histórico 2026-2100",
    heroDescription:
      "Una wiki ficticia para seguir la evolución del mundo desde la crisis inicial hasta la cumbre que discute quién tiene derecho al futuro.",
    timelineSectionTitle: "Cronología base",
    timelineSectionLinkLabel: "Ver timeline completo",
    blocsSectionTitle: "Acceso por bloques",
    blocsSectionKicker: "Mapa político resumido",
    directorySectionTitle: "Directorio de países",
    directorySectionDescription:
      "Abrí la lista completa de países y regiones para ver su presencia en AG, CCH y CSyM y navegar directo a cada ficha.",
    directorySectionButtonLabel: "Ver países"
  },
  timeline: {
    eyebrow: "Vista global",
    title: "Timeline del escenario",
    description:
      "Recorrido cronológico de los hitos principales del universo ficticio desde 2026 hasta 2100.",
    allErasLabel: "Todas las eras",
    allTypesLabel: "Todos los tipos",
    allBlocsLabel: "Todos los bloques",
    filterButtonLabel: "Filtrar",
    emptyMessage: "No hay hitos que coincidan con los filtros seleccionados."
  },
  search: {
    eyebrow: "Búsqueda",
    title: "Explorar la wiki",
    description:
      "Busca por título, resumen o cuerpo de artículo. En la fase actual se utiliza un índice local mock.",
    placeholder: "Ejemplo: litio, cumbre, tecnópolis",
    buttonLabel: "Buscar",
    emptyQueryMessage: "Escribe un término para empezar.",
    noResultsTemplate: "No se encontraron resultados para \"{{query}}\"."
  },
  countries: {
    eyebrow: "Países y órganos",
    title: "Lista completa de países",
    description:
      "Esta matriz resume qué países y regiones aparecen en cada órgano del escenario. Cada fila abre la ficha individual del país para seguir su información detallada.",
    organCountDescription: "Países con presencia en este órgano.",
    matrixTitle: "Matriz de presencia institucional",
    matrixKicker: "Orden base tomado del archivo CSV"
  },
  countryPage: {
    badgeLabel: "Ficha país",
    snapshotBadgeTemplate: "{{count}} snapshot(s)",
    summaryFallback:
      "Ficha inicial disponible. Completa el desarrollo narrativo desde el panel admin.",
    mapSectionTitle: "Mapa",
    profileSectionTitle: "Perfil narrativo",
    profileFallbackMarkdown:
      "## Pendiente editorial\n\nEsta ficha todavía no tiene contenido narrativo desarrollado.",
    quickSummaryTitle: "Resumen rápido",
    quickSummarySnapshotsLabel: "Snapshots",
    quickSummaryBlocLabel: "Bloque",
    quickSummaryLatestEraLabel: "Última era",
    quickSummaryOrgansLabel: "Órganos",
    quickSummaryMapLabel: "Mapa",
    quickSummaryNoBlocValue: "Sin bloque",
    quickSummaryNoEraValue: "Sin era",
    quickSummaryMapAvailableValue: "Disponible",
    quickSummaryMapPendingValue: "Pendiente",
    noOrgansBadgeLabel: "Sin órganos"
  },
  countryScorecard: {
    emptyTitle: "Scorecard",
    emptyDescription: "Todavía no hay snapshots cargados para este país.",
    latestTitle: "Scorecard más reciente",
    snapshotsLabel: "Snapshots",
    blocLabel: "Bloque",
    noBlocValue: "Sin bloque",
    lastMilestoneLabel: "Último hito",
    noMilestoneValue: "Sin hito",
    historyTitle: "Historial de snapshots",
    referenceColumnLabel: "Referencia"
  },
  countryPresenceBoard: {
    footerText:
      "Cada fila es clickeable. La presencia activa por órgano se marca en color y los espacios vacíos quedan reservados para los órganos donde ese país no participa."
  },
  eraPage: {
    sectionTitle: "Hitos de la era"
  },
  categoryPage: {
    eyebrow: "Categoría"
  },
  articlePage: {
    categoriesSectionTitle: "Categorías",
    relatedSectionTitle: "Ver también",
    tableOfContentsTitle: "Contenido"
  }
};

export const defaultWikiSiteConfig: WikiSiteConfig = {
  eras,
  categories,
  blocs,
  copy: defaultPublicWikiCopy
};
