alter table public.countries
add column if not exists organ_memberships jsonb;
