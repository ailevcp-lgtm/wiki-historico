alter table public.articles
add column if not exists bloc_slugs text[] not null default '{}';

create index if not exists idx_articles_bloc_slugs on public.articles using gin(bloc_slugs);
