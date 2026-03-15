# CODEX — Documento Operativo: Wiki Histórico 2100

## 1. Propósito del proyecto

Construir una web app tipo wiki para un universo ficticio de debate llamado **Histórico Futurista 2026-2100**.

La plataforma debe:

- parecer visualmente una mezcla entre **Wikipedia** y **Fandom/MediaWiki**;
- ser cómoda de leer desde **teléfono** antes que desde desktop;
- permitir una futura **carga masiva de documentos editoriales**;
- separar con claridad la capa visual, la capa de contenido y la futura capa de administración;
- servir como base para que otros agentes puedan continuar el desarrollo sin perder contexto.

Importante:

- El sistema **no inventa el contenido histórico oficial**.
- El contenido lo define el equipo SEA/AILE.
- Esta primera implementación se concentra en el **esqueleto del sistema**, la experiencia wiki y el contrato de datos.

---

## 2. Objetivos de producto

### Objetivo principal

Ofrecer una wiki ficticia, navegable y creíble, donde los delegados puedan consultar acontecimientos, actores, eras, bloques y tratados del período 2026-2100.

### Objetivos técnicos

1. Tener una base visual consistente estilo wiki.
2. Poder renderizar artículos en Markdown con enlaces internos tipo `[[slug]]`.
3. Poder reemplazar datos mock por Supabase sin reescribir toda la UI.
4. Dejar preparado el sistema para una futura importación editorial.
5. Asegurar responsive real, especialmente en pantallas móviles.

### No objetivos de esta fase

- No cerrar todavía el panel admin completo.
- No cerrar todavía autenticación final.
- No cerrar todavía importación automática desde `.doc` legacy.
- No diseñar todavía el modelo completo de país con gráficos finales.

---

## 3. Decisiones de arquitectura para arrancar

Estas decisiones quedan fijadas para evitar ambigüedad entre agentes:

1. **Frontend**: Next.js con App Router.
2. **Estilos**: Tailwind CSS + CSS custom para clonar la experiencia visual wiki.
3. **Datos en fase 1**: repositorio local mockeado, con una capa de acceso intercambiable.
4. **Datos en fase 2**: Supabase como origen real.
5. **Contenido de artículos**: Markdown.
6. **Enlaces internos**: sintaxis wiki `[[slug]]` y `[[slug|texto visible]]`.
7. **Importación futura**: primero pasar por una capa de normalización; no parsear directo a producción.

### Principio clave

La UI nunca debe depender de Supabase de forma rígida. Debe existir una capa intermedia tipo repositorio para que:

- hoy funcione con mocks;
- mañana funcione con Supabase;
- más adelante pueda existir una cola de importación/editorial.

---

## 4. Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js (App Router) |
| Datos en MVP visual | Repositorio local mock |
| Base de datos objetivo | Supabase (PostgreSQL + Auth + Storage) |
| Estilos | Tailwind CSS + CSS custom |
| Deploy | Vercel |
| Imágenes | Supabase Storage |

---

## 5. Referencia visual

Replicar una estética fuertemente inspirada en **Wikipedia** + **Fandom Desktop skin**:

- Fondo de aplicación gris muy claro.
- Superficie de lectura blanca.
- Títulos con tipografía serif.
- Cuerpo con sans-serif neutra.
- Sidebar izquierda en desktop.
- Menú hamburguesa en mobile.
- TOC automático.
- Infobox a la derecha en desktop y arriba del contenido en mobile.
- Enlaces azules para páginas existentes.
- Enlaces rojos para páginas inexistentes.
- Tablas y cajas con bordes gris wiki.

### Paleta base

| Elemento | Color |
|----------|-------|
| Fondo contenido | `#FFFFFF` |
| Fondo aplicación | `#F8F9FA` |
| Texto principal | `#202122` |
| Link interno existente | `#0645AD` |
| Link interno faltante | `#CC2200` |
| Header infobox | `#A7D7F9` |
| Bordes | `#A2A9B1` |
| Texto secundario | `#54595D` |
| Fondo categorías | `#EAECF0` |

### Reglas visuales obligatorias

- El layout debe sentirse como una wiki antes que como una landing.
- La lectura móvil es prioritaria.
- Los títulos `h1`, `h2`, `h3` deben tener jerarquía clara y aire.
- Las tablas deben ser legibles sin romper el viewport.
- No usar una estética moderna genérica; debe verse enciclopédico/editorial.

---

## 6. Estructura funcional del sistema

La app se divide en cinco capas:

1. **Presentación**: páginas y componentes visuales tipo wiki.
2. **Dominio**: tipos, validaciones suaves, helpers de labels y relaciones.
3. **Contenido**: artículos, eras, categorías, países, bloques.
4. **Persistencia**: repositorio mock hoy, Supabase después.
5. **Ingesta editorial**: importación desde documentos hacia una capa staging.

### Estructura de carpetas objetivo

```text
app/
  layout.tsx
  page.tsx
  article/[slug]/page.tsx
  era/[slug]/page.tsx
  category/[slug]/page.tsx
  timeline/page.tsx
  search/page.tsx
  country/[slug]/page.tsx
  admin/...                     # fase 2

components/
  wiki-shell.tsx
  infobox.tsx
  table-of-contents.tsx
  article-markdown.tsx
  wiki-link.tsx

lib/
  repository.ts                 # contrato de acceso a datos
  mock-data.ts                  # semilla local
  markdown.ts                   # TOC + parser wiki-links
  utils.ts

types/
  wiki.ts

supabase/
  migrations/                   # fase 2
```

---

## 7. Modelo de datos objetivo

### Correcciones importantes sobre el modelo original

Estas correcciones se adoptan desde ahora:

1. `articles.type` debe incluir también `bloc` y `conflict`, porque ya existen en los infobox.
2. `categories` conviene guardarlo como `category_slugs TEXT[]`, no como nombres visibles.
3. `era` conviene pasar a `era_slug TEXT` para mantener coherencia con rutas y navegación.
4. La importación editorial necesita una tabla staging adicional para no romper producción.
5. Los links relacionados pueden arrancar con `related_slugs TEXT[]` en MVP.

### Tabla: `articles`

```sql
CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,                     -- 'event', 'organization', 'treaty', 'technology', 'geography', 'society', 'summit', 'bloc', 'conflict'
  content TEXT NOT NULL,                 -- Markdown
  summary TEXT,
  infobox JSONB,
  category_slugs TEXT[] DEFAULT '{}',
  related_slugs TEXT[] DEFAULT '{}',
  era_slug TEXT REFERENCES timeline_eras(slug),
  hito_id TEXT,
  year_start INTEGER,
  year_end INTEGER,
  image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'draft',           -- 'draft', 'review', 'published'
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_type ON articles(type);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_era ON articles(era_slug);
CREATE INDEX idx_articles_year ON articles(year_start);
```

### Tabla: `countries`

```sql
CREATE TABLE countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bloc TEXT,
  summary TEXT,
  profile_markdown TEXT,
  flag_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla: `country_scores`

```sql
CREATE TABLE country_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  hito_id TEXT,
  era_slug TEXT REFERENCES timeline_eras(slug),
  climate_exposure INTEGER CHECK (climate_exposure BETWEEN 1 AND 5),
  state_capacity INTEGER CHECK (state_capacity BETWEEN 1 AND 5),
  power_resources INTEGER CHECK (power_resources BETWEEN 1 AND 5),
  tech_dependency INTEGER CHECK (tech_dependency BETWEEN 1 AND 5),
  demographic_pressure INTEGER CHECK (demographic_pressure BETWEEN 1 AND 5),
  social_cohesion INTEGER CHECK (social_cohesion BETWEEN 1 AND 5),
  economic_vulnerability INTEGER CHECK (economic_vulnerability BETWEEN 1 AND 5),
  climate_trend TEXT CHECK (climate_trend IN ('up', 'down', 'stable')),
  state_trend TEXT CHECK (state_trend IN ('up', 'down', 'stable')),
  power_trend TEXT CHECK (power_trend IN ('up', 'down', 'stable')),
  tech_trend TEXT CHECK (tech_trend IN ('up', 'down', 'stable')),
  demographic_trend TEXT CHECK (demographic_trend IN ('up', 'down', 'stable')),
  social_trend TEXT CHECK (social_trend IN ('up', 'down', 'stable')),
  economic_trend TEXT CHECK (economic_trend IN ('up', 'down', 'stable')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scores_country ON country_scores(country_id);
CREATE INDEX idx_scores_era ON country_scores(era_slug);
```

### Tabla: `categories`

```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT
);
```

### Tabla: `timeline_eras`

```sql
CREATE TABLE timeline_eras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  number INTEGER NOT NULL,
  name TEXT NOT NULL,
  year_start INTEGER NOT NULL,
  year_end INTEGER NOT NULL,
  theme TEXT,
  color TEXT
);
```

### Tabla staging recomendada: `source_documents`

Esta tabla no es obligatoria en la primera demo visual, pero sí es la opción correcta para la importación futura.

```sql
CREATE TABLE source_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,            -- nombre original del archivo/doc
  source_format TEXT NOT NULL,          -- 'docx', 'gdoc-export', 'markdown', 'txt'
  raw_text TEXT NOT NULL,
  normalized_payload JSONB,
  target_slug TEXT,
  import_status TEXT DEFAULT 'pending', -- 'pending', 'parsed', 'needs_review', 'imported', 'failed'
  parse_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. Contrato editorial para importación futura

### Decisión confirmada

El formato de trabajo confirmado para importación es **`.docx`**.

Implicancias:

1. No se debe diseñar el importador alrededor de `.doc` legacy.
2. La extracción de contenido puede apoyarse en un parser OOXML tipo `mammoth`.
3. Google Docs debe exportarse a `.docx` antes de entrar al flujo de importación.

### Plantilla editorial confirmada del CEA

Las fichas del CEA siguen una plantilla **semi-fija**. El importador debe asumir estructura guiada, no texto completamente libre.

#### Ficha de Hito

Campos detectados en la plantilla:

- `ID del Hito`
- `Título del artículo wiki`
- `Tipo`
- `Ubicación / Alcance`
- `Actores principales`
- `Era / Contexto`
- `1. Antecedentes`
- `2. Desarrollo`
- `3. Consecuencias inmediatas`
- `4. Consecuencias a largo plazo`
- `5. Países / regiones afectados`
- `6. Datos clave para la wiki`
- `7. Conexiones con otros hitos`

#### Ficha de País / Región

Campos detectados en la plantilla:

- `País / Región`
- `Bloque (2085)`
- `Hito de referencia`
- `Período evaluado`
- 7 variables con `puntaje`, `tendencia` y `notas`
- perfil narrativo
- historial opcional por era

### Formato canónico interno

Cada ficha importada debe terminar mapeada a esta estructura canónica:

```text
TITULO: Crisis del Litio Andino
SLUG: crisis-del-litio-andino
TIPO: event
ERA: era-1
HITO_ID: H-003
YEAR_START: 2028
YEAR_END: 2029
SUMMARY: La disputa por el litio del Cono Sur redefinió los bloques regionales.
CATEGORIES:
- eventos-y-crisis
- recursos-estrategicos
RELATED:
- pacto-de-cordoba-2031
- tecnopolis

INFOBOX:
- date: Marzo 2028 - Enero 2029
- location: Andes centrales
- event_type: Crisis de recursos
- consequences: Militarización parcial de corredores logísticos

CONTENT:
## Contexto
...

## Desarrollo
...

## Consecuencias
...
```

### Flujo correcto de importación

1. Subir documento fuente.
2. Extraer texto.
3. Normalizar campos obligatorios.
4. Validar slugs, tipo, era, años y categorías.
5. Guardar en `source_documents`.
6. Revisión humana si hay errores o ambigüedad.
7. Recién entonces crear o actualizar `articles`.

### Estado actual de implementación

La primera capa del importador debe ofrecer:

1. subida de `.docx`;
2. extracción de texto;
3. detección automática de plantilla `hito` o `país`;
4. preview del borrador normalizado;
5. lista de warnings y errores antes de persistir.

### Campos mínimos obligatorios por artículo importable

- `title`
- `slug`
- `type`
- `content`
- `summary`
- `era_slug`
- `year_start`

### Campos opcionales

- `year_end`
- `infobox`
- `related_slugs`
- `image_url`
- `author`
- `featured`

---

## 9. Esquema de infobox

`articles.infobox` es JSONB flexible según `type`.

### Evento

```json
{
  "type": "event",
  "date": "Junio - Septiembre 2026",
  "location": "Africa Oriental, Sur de Asia",
  "event_type": "Crisis climatica",
  "casualties": "~120.000",
  "consequences": "Colapso agricola parcial",
  "related": ["cumbre-de-nairobi-2027"]
}
```

### Organización

```json
{
  "type": "organization",
  "founded": "2030",
  "headquarters": "Multiple (descentralizada)",
  "leader": "Directorio de Gobernanza Funcional",
  "ideology": "Tecnocracia contractual",
  "members": "94 paises (2085)",
  "bloc": "Tecnopolis",
  "motto": "Estabilidad es libertad"
}
```

### Tratado

```json
{
  "type": "treaty",
  "date": "14 de marzo de 2037",
  "location": "Yakarta, Indonesia",
  "signatories": "23 paises",
  "treaty_type": "Declaracion fundacional",
  "result": "Creacion de la Confederacion de la Ummah",
  "status": "Vigente"
}
```

### Bloque

```json
{
  "type": "bloc",
  "founded": "2041",
  "key_members": "Argentina, Brasil, Mexico, Nigeria, India",
  "resources": "Litio, soja, agua dulce, energia solar",
  "population": "~2.800 millones (2085)",
  "ideology": "Soberania distribuida",
  "capital": "Quito (desde 2060)",
  "summit_proposal": "Soberania Distribuida"
}
```

### Conflicto

```json
{
  "type": "conflict",
  "date": "2034 - 2035",
  "location": "Cuenca del Nilo",
  "sides": [
    ["Egipto", "Sudan"],
    ["Etiopia"]
  ],
  "mediator": "Union Africana",
  "result": "Alto al fuego",
  "casualties": "~45.000"
}
```

---

## 10. Páginas objetivo

```text
app/
  layout.tsx
  page.tsx
  article/[slug]/page.tsx
  era/[slug]/page.tsx
  category/[slug]/page.tsx
  country/[slug]/page.tsx
  timeline/page.tsx
  search/page.tsx
  admin/page.tsx                # fase 2
  api/articles/route.ts         # fase 2
  api/countries/route.ts        # fase 2
  api/search/route.ts           # fase 2
```

### Portada

Secciones:

1. Banner principal.
2. Mini timeline por eras.
3. Artículo destacado.
4. Acceso por bloques.
5. Últimos publicados.
6. Estadísticas.

### Artículo

- `h1`
- metadata
- TOC
- infobox
- markdown renderizado
- categorías
- ver también

### Era

- banner con color
- descripción
- tabla/lista de hitos
- navegación entre eras

### Categoría

- descripción
- artículos listados

### Timeline

- listado cronológico global
- filtros posteriores

### Search

- input
- resultados simples en MVP

### Country

- placeholder navegable en fase 1 o versión mínima
- scorecard completa en fase 2

---

## 11. Componentes principales

### `<WikiShell />`

- Sidebar izquierda.
- Topbar.
- Área central.
- Drawer mobile.

### `<ArticleMarkdown />`

- Renderiza Markdown.
- Soporta tablas, listas, citas, imágenes y headings.
- Convierte links wiki a links de aplicación.

### `<TableOfContents />`

- Genera navegación desde `##` y `###`.

### `<Infobox />`

- Render flexible por tipo.
- Imagen opcional.
- Links internos reutilizables.

### `<WikiLink />`

- Azul si existe.
- Rojo si no existe.

### `<TimelineView />`

- Lista cronológica por año.

---

## 12. Renderizado de Markdown

Soporte requerido:

- `##` y `###`
- bold / italic / strikethrough
- listas
- tablas
- blockquotes
- imágenes
- enlaces externos
- enlaces internos wiki-style

### Regla de parser

1. Detectar `[[slug]]`.
2. Detectar `[[slug|label]]`.
3. Convertir a links internos.
4. Resolver si el slug existe.
5. Pintar azul o rojo según existencia.

### Regla de TOC

Solo usar `h2` y `h3`.

### Regla de responsive

En móvil:

- TOC colapsado o apilado.
- Infobox arriba.
- Tablas con overflow horizontal.

---

## 13. Sidebar y navegación

Secciones del sidebar:

- Portada
- Timeline
- Búsqueda
- Eras
- Categorías
- Bloques

Reglas:

- ancho fijo en desktop;
- overlay en mobile;
- navegación clara con hover suave;
- diseño sobrio y enciclopédico.

---

## 14. Políticas de acceso

| Rol | Leer `published` | Leer drafts | Crear/Editar | Admin |
|-----|------------------|-------------|-------------|-------|
| Anónimo | ✅ | ❌ | ❌ | ❌ |
| Editor | ✅ | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ |

Notas:

- Delegados solo ven publicado.
- Equipo AILE accede con Supabase Auth.
- No hay registro público.

---

## 15. Estrategia de implementación

### Fase 1 — Esqueleto funcional

1. Proyecto Next.js inicial.
2. Tema visual wiki.
3. Repositorio mock.
4. Home.
5. Artículo.
6. Era.
7. Categoría.
8. Timeline.
9. Search simple.

### Fase 2 — Datos reales

1. Supabase schema.
2. RLS.
3. Repositorio Supabase.
4. Búsqueda real.

### Fase 3 — Flujo editorial

1. Admin.
2. Editor Markdown.
3. Preview.
4. Estados draft/review/published.
5. Upload de imágenes.

### Fase 4 — Importación

1. Ingesta de documentos.
2. Normalización.
3. Cola de revisión.
4. Importación masiva.

### Fase 5 — Países y visualizaciones

1. Scorecard.
2. Radar chart.
3. Comparativas.

---

## 16. Requisitos de responsive

Estos son obligatorios:

1. Sidebar colapsable por botón.
2. Infobox full width en menos de `768px`.
3. Timeline legible en teléfono.
4. Texto con tamaño cómodo sin zoom.
5. Targets táctiles amplios.

Si una decisión estética rompe mobile, se descarta.

---

## 17. Riesgos técnicos ya identificados

1. **`.doc` legacy** es mala fuente para importación robusta.
2. Los links rojos exigen resolver existencia de slugs en tiempo de render.
3. El contenido editorial puede venir con formatos inconsistentes.
4. El look wiki puede degradarse si se usa demasiado layout moderno.
5. La tabla `country_scores` necesita reglas claras de edición por hito y era.

---

## 18. Preguntas abiertas para el usuario / SEA

Estas preguntas siguen abiertas y deben responderse pronto:

1. ¿La carga futura va a ser por importación masiva desde archivos o por copiado manual en un admin?
2. ¿Los artículos deben llevar aprobación editorial antes de publicarse?
3. ¿Los delegados verán solo artículos o también fichas de países y bloques?
4. ¿Se va a permitir editar desde celular o solo consultar desde celular?

---

## 19. Estado esperado al terminar la primera implementación

La primera implementación queda bien si:

- ya existe una app navegable;
- visualmente ya parece una wiki;
- hay datos mock realistas;
- el código está listo para reemplazar el origen de datos;
- el documento sigue sirviendo como contrato de arquitectura;
- otro agente puede retomar sin tener que redescubrir la lógica del sistema.
