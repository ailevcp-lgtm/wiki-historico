alter table public.countries
add column if not exists representative_url text;

update public.countries
set
  representative_url = coalesce(representative_url, flag_url),
  flag_url = null
where representative_url is null
  and flag_url is not null;
