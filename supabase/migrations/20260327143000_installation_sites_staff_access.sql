-- Ensure current/future staff can view installation sites, while delete is admin-only.
-- Also repairs profile rows/roles so existing engineers are recognized by RLS.

-- 1) Backfill missing profile rows from auth.users (idempotent).
insert into public.profiles (id, role, name, email, phone, address)
select
  u.id,
  coalesce(nullif(lower(u.raw_user_meta_data->>'role'), ''), 'customer') as role,
  nullif(u.raw_user_meta_data->>'name', '') as name,
  u.email,
  nullif(u.raw_user_meta_data->>'phone', '') as phone,
  nullif(u.raw_user_meta_data->>'address', '') as address
from auth.users u
on conflict (id) do nothing;

-- 2) Keep profile role in sync with auth metadata when metadata provides a valid role.
update public.profiles p
set role = lower(u.raw_user_meta_data->>'role')
from auth.users u
where u.id = p.id
  and lower(coalesce(u.raw_user_meta_data->>'role', '')) in ('admin', 'engineer', 'customer')
  and coalesce(lower(p.role), '') <> lower(u.raw_user_meta_data->>'role');

-- 3) Replace installation_sites policies with explicit staff/admin split.
drop policy if exists "installation_sites_select" on public.installation_sites;
drop policy if exists "installation_sites_insert" on public.installation_sites;
drop policy if exists "installation_sites_update" on public.installation_sites;
drop policy if exists "installation_sites_delete" on public.installation_sites;
drop policy if exists "installation_sites_admin_all" on public.installation_sites;
drop policy if exists "installation_sites_select_staff" on public.installation_sites;
drop policy if exists "installation_sites_insert_staff" on public.installation_sites;
drop policy if exists "installation_sites_update_staff" on public.installation_sites;
drop policy if exists "installation_sites_delete_admin" on public.installation_sites;

create policy "installation_sites_select_staff"
on public.installation_sites
for select
using (public.is_admin_or_engineer());

create policy "installation_sites_insert_staff"
on public.installation_sites
for insert
with check (public.is_admin_or_engineer());

create policy "installation_sites_update_staff"
on public.installation_sites
for update
using (public.is_admin_or_engineer())
with check (public.is_admin_or_engineer());

create policy "installation_sites_delete_admin"
on public.installation_sites
for delete
using (public.is_admin());
