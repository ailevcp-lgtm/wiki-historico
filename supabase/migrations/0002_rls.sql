create or replace function public.app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'app_role', 'anon');
$$;

alter table public.timeline_eras enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.countries enable row level security;
alter table public.country_scores enable row level security;
alter table public.source_documents enable row level security;

drop policy if exists "public can read eras" on public.timeline_eras;
create policy "public can read eras"
on public.timeline_eras
for select
using (true);

drop policy if exists "editors manage eras" on public.timeline_eras;
create policy "editors manage eras"
on public.timeline_eras
for all
using (public.app_role() in ('editor', 'admin'))
with check (public.app_role() in ('editor', 'admin'));

drop policy if exists "public can read categories" on public.categories;
create policy "public can read categories"
on public.categories
for select
using (true);

drop policy if exists "editors manage categories" on public.categories;
create policy "editors manage categories"
on public.categories
for all
using (public.app_role() in ('editor', 'admin'))
with check (public.app_role() in ('editor', 'admin'));

drop policy if exists "public can read published articles" on public.articles;
create policy "public can read published articles"
on public.articles
for select
using (status = 'published');

drop policy if exists "editors can read all articles" on public.articles;
create policy "editors can read all articles"
on public.articles
for select
using (public.app_role() in ('editor', 'admin'));

drop policy if exists "editors manage articles" on public.articles;
create policy "editors manage articles"
on public.articles
for all
using (public.app_role() in ('editor', 'admin'))
with check (public.app_role() in ('editor', 'admin'));

drop policy if exists "editors can read countries" on public.countries;
drop policy if exists "public can read countries" on public.countries;
create policy "public can read countries"
on public.countries
for select
using (true);

drop policy if exists "editors manage countries" on public.countries;
create policy "editors manage countries"
on public.countries
for all
using (public.app_role() in ('editor', 'admin'))
with check (public.app_role() in ('editor', 'admin'));

drop policy if exists "editors can read country scores" on public.country_scores;
drop policy if exists "public can read country scores" on public.country_scores;
create policy "public can read country scores"
on public.country_scores
for select
using (true);

drop policy if exists "editors manage country scores" on public.country_scores;
create policy "editors manage country scores"
on public.country_scores
for all
using (public.app_role() in ('editor', 'admin'))
with check (public.app_role() in ('editor', 'admin'));

drop policy if exists "editors manage source documents" on public.source_documents;
create policy "editors manage source documents"
on public.source_documents
for all
using (public.app_role() in ('editor', 'admin'))
with check (public.app_role() in ('editor', 'admin'));
