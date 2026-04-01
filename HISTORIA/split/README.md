# Split de HISTORIA

Generado: 2026-03-29T20:44:54.886Z

## Salida

- Eras: 4
- Hitos: 44
- Países: 31

## Hallazgos principales

- Hitos con ID faltante o de ejemplo: 0
- Países con referencias de hito no normalizadas: 0
- Países con tendencias no estándar: 0
- Imágenes extraídas desde DOCX: 60

## Archivos

- `eras/`: un archivo por era completa
- `hitos/<era-slug>/`: un archivo por hito
- `paises/`: un archivo por país o región
- `audit-report.json`: reporte completo por documento
- `public/images/history-docs/`: imágenes extraídas del DOCX y referenciadas desde los `.md`

## Próximo uso recomendado

1. La normalización mecánica ya quedó aplicada en los archivos separados.
2. Revisar únicamente los documentos marcados con issues en `audit-report.json`.
3. Probar primero el piloto en `/admin/import` y después correr el lote completo.
