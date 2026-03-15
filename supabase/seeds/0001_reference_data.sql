insert into public.categories (slug, name, description, icon)
values
  ('eventos-y-crisis', 'Eventos y Crisis', 'Choques climáticos, logísticos o políticos que alteran la línea histórica.', '⛈'),
  ('tratados', 'Tratados', 'Acuerdos formales que reordenan instituciones, fronteras o reglas de cooperación.', '📜'),
  ('bloques-y-actores', 'Bloques y Actores', 'Organizaciones, coaliciones y bloques de poder del escenario histórico futurista.', '🏛'),
  ('tecnologia-y-control', 'Tecnología y Control', 'Infraestructuras críticas, plataformas y doctrinas técnicas que reorganizan la autoridad.', '⚙'),
  ('cumbre-2100', 'Cumbre 2100', 'Entradas conectadas con el evento final y el debate sobre el derecho al futuro.', '🕰')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon;

insert into public.timeline_eras (slug, number, name, year_start, year_end, theme, color, description)
values
  (
    'era-1',
    1,
    'El Mundo que Resiste',
    2026,
    2032,
    'Crisis encadenadas y pactos de supervivencia',
    '#5A7FA8',
    'Los primeros años del escenario histórico futurista combinan emergencias climáticas, presión migratoria y nuevos acuerdos funcionales.'
  ),
  (
    'era-2',
    2,
    'Arquitecturas de Bloque',
    2033,
    2050,
    'Se consolidan polos regionales con reglas y soberanías propias',
    '#748067',
    'Los estados dejan de actuar de forma aislada y aparecen alianzas de recursos, tecnología y seguridad alimentaria.'
  ),
  (
    'era-3',
    3,
    'Soberanías Adaptativas',
    2051,
    2075,
    'La gobernanza se vuelve híbrida y experimental',
    '#8E6F56',
    'El planeta entra en una etapa de innovación institucional donde los bloques crean reglas cruzadas para sostener estabilidad.'
  ),
  (
    'era-4',
    4,
    'La Negociación del Futuro',
    2076,
    2100,
    'Las potencias funcionales disputan el derecho político a definir el siglo XXII',
    '#7B4F62',
    'Las últimas décadas concentran la tensión entre legitimidad, eficiencia y justicia intergeneracional.'
  )
on conflict (slug) do update
set
  number = excluded.number,
  name = excluded.name,
  year_start = excluded.year_start,
  year_end = excluded.year_end,
  theme = excluded.theme,
  color = excluded.color,
  description = excluded.description;
