insert into storage.buckets (id, name, public)
values ('resort-media', 'resort-media', true)
on conflict (id) do nothing;

create policy "Admin upload resort media" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'resort-media' and public.is_admin(auth.uid())
);

create policy "Admin update resort media" on storage.objects
for update to authenticated
using (
  bucket_id = 'resort-media' and public.is_admin(auth.uid())
)
with check (
  bucket_id = 'resort-media' and public.is_admin(auth.uid())
);

create policy "Admin delete resort media" on storage.objects
for delete to authenticated
using (
  bucket_id = 'resort-media' and public.is_admin(auth.uid())
);

create policy "Public read resort media" on storage.objects
for select
using (bucket_id = 'resort-media');
