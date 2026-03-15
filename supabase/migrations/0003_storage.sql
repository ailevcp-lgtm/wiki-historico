insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wiki-images',
  'wiki-images',
  true,
  10485760,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can read wiki images" on storage.objects;
create policy "public can read wiki images"
on storage.objects
for select
using (bucket_id = 'wiki-images');

drop policy if exists "editors can upload wiki images" on storage.objects;
create policy "editors can upload wiki images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wiki-images'
  and public.app_role() in ('editor', 'admin')
);

drop policy if exists "editors can update wiki images" on storage.objects;
create policy "editors can update wiki images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'wiki-images'
  and public.app_role() in ('editor', 'admin')
)
with check (
  bucket_id = 'wiki-images'
  and public.app_role() in ('editor', 'admin')
);

drop policy if exists "admins can delete wiki images" on storage.objects;
create policy "admins can delete wiki images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'wiki-images'
  and public.app_role() = 'admin'
);
