create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'article_type') then
    create type public.article_type as enum (
      'event',
      'organization',
      'treaty',
      'technology',
      'geography',
      'society',
      'summit',
      'bloc',
      'conflict'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'article_status') then
    create type public.article_status as enum ('draft', 'review', 'published');
  end if;

  if not exists (select 1 from pg_type where typname = 'trend_direction') then
    create type public.trend_direction as enum ('up', 'down', 'stable');
  end if;

  if not exists (select 1 from pg_type where typname = 'source_document_kind') then
    create type public.source_document_kind as enum ('hito', 'country', 'unknown');
  end if;

  if not exists (select 1 from pg_type where typname = 'source_import_status') then
    create type public.source_import_status as enum (
      'pending',
      'parsed',
      'needs_review',
      'imported',
      'failed'
    );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.timeline_eras (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  number integer not null unique,
  name text not null,
  year_start integer not null,
  year_end integer not null,
  theme text,
  color text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timeline_eras_year_order check (year_end >= year_start)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  type public.article_type not null,
  content text not null,
  summary text,
  infobox jsonb,
  category_slugs text[] not null default '{}',
  related_slugs text[] not null default '{}',
  era_slug text references public.timeline_eras(slug) on update cascade,
  hito_id text,
  year_start integer,
  year_end integer,
  image_url text,
  featured boolean not null default false,
  status public.article_status not null default 'draft',
  author text,
  search_document tsvector generated always as (
    to_tsvector(
      'spanish',
      coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_year_order check (year_end is null or year_start is null or year_end >= year_start)
);

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  bloc text,
  summary text,
  profile_markdown text,
  flag_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.country_scores (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  hito_id text,
  era_slug text references public.timeline_eras(slug) on update cascade,
  climate_exposure integer check (climate_exposure between 1 and 5),
  state_capacity integer check (state_capacity between 1 and 5),
  power_resources integer check (power_resources between 1 and 5),
  tech_dependency integer check (tech_dependency between 1 and 5),
  demographic_pressure integer check (demographic_pressure between 1 and 5),
  social_cohesion integer check (social_cohesion between 1 and 5),
  economic_vulnerability integer check (economic_vulnerability between 1 and 5),
  climate_trend public.trend_direction,
  state_trend public.trend_direction,
  power_trend public.trend_direction,
  tech_trend public.trend_direction,
  demographic_trend public.trend_direction,
  social_trend public.trend_direction,
  economic_trend public.trend_direction,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_format text not null,
  detected_kind public.source_document_kind not null default 'unknown',
  raw_text text not null,
  normalized_payload jsonb,
  target_slug text,
  import_status public.source_import_status not null default 'pending',
  parse_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_articles_type on public.articles(type);
create index if not exists idx_articles_status on public.articles(status);
create index if not exists idx_articles_era_slug on public.articles(era_slug);
create index if not exists idx_articles_year_start on public.articles(year_start);
create index if not exists idx_articles_search_document on public.articles using gin(search_document);
create index if not exists idx_articles_category_slugs on public.articles using gin(category_slugs);
create index if not exists idx_articles_related_slugs on public.articles using gin(related_slugs);

create index if not exists idx_country_scores_country_id on public.country_scores(country_id);
create index if not exists idx_country_scores_era_slug on public.country_scores(era_slug);

create index if not exists idx_source_documents_status on public.source_documents(import_status);
create index if not exists idx_source_documents_kind on public.source_documents(detected_kind);
create index if not exists idx_source_documents_target_slug on public.source_documents(target_slug);

drop trigger if exists trg_timeline_eras_updated_at on public.timeline_eras;
create trigger trg_timeline_eras_updated_at
before update on public.timeline_eras
for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

drop trigger if exists trg_countries_updated_at on public.countries;
create trigger trg_countries_updated_at
before update on public.countries
for each row execute function public.set_updated_at();

drop trigger if exists trg_source_documents_updated_at on public.source_documents;
create trigger trg_source_documents_updated_at
before update on public.source_documents
for each row execute function public.set_updated_at();
