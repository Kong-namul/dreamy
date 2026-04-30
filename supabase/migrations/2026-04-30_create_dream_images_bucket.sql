-- Permanent illustrated diary images.
-- Pages store public Storage URLs so generated images do not change later.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dream-images',
  'dream-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Dream images are publicly readable" on storage.objects;

create policy "Dream images are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'dream-images');
