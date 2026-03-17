-- Allow customers to attach a photo/video to complaints.

-- 1) Store attachment metadata on complaints
alter table public.complaints
  add column if not exists attachments jsonb not null default '[]';

-- 2) Storage bucket for complaint media (photos + videos)
insert into storage.buckets (id, name, public)
values ('complaint-media', 'complaint-media', true)
on conflict (id) do nothing;

-- Ensure bucket is public (idempotent)
update storage.buckets
set public = true
where id = 'complaint-media';

-- 3) Storage policies:
-- - Customers can upload/read their own objects (via owner column)
-- - Admin/Engineer can upload/read/update/delete all
do $$
begin
  -- Customer insert (own)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'complaint_media_insert_own'
  ) then
    create policy "complaint_media_insert_own"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'complaint-media'
      and owner = auth.uid()
    );
  end if;

  -- Customer select (own)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'complaint_media_select_own'
  ) then
    create policy "complaint_media_select_own"
    on storage.objects for select
    to authenticated
    using (
      bucket_id = 'complaint-media'
      and owner = auth.uid()
    );
  end if;

  -- Admin/Engineer insert
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'complaint_media_insert_admin'
  ) then
    create policy "complaint_media_insert_admin"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'complaint-media'
      and public.is_admin_or_engineer()
    );
  end if;

  -- Admin/Engineer select
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'complaint_media_select_admin'
  ) then
    create policy "complaint_media_select_admin"
    on storage.objects for select
    to authenticated
    using (
      bucket_id = 'complaint-media'
      and public.is_admin_or_engineer()
    );
  end if;

  -- Admin/Engineer update
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'complaint_media_update_admin'
  ) then
    create policy "complaint_media_update_admin"
    on storage.objects for update
    to authenticated
    using (
      bucket_id = 'complaint-media'
      and public.is_admin_or_engineer()
    );
  end if;

  -- Admin/Engineer delete
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'complaint_media_delete_admin'
  ) then
    create policy "complaint_media_delete_admin"
    on storage.objects for delete
    to authenticated
    using (
      bucket_id = 'complaint-media'
      and public.is_admin_or_engineer()
    );
  end if;
end;
$$;

