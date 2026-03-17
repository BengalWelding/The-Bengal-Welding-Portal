-- Add user fields + product counter cache to profiles for fast admin listings

-- 1) Add columns
alter table public.profiles
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists products_count integer not null default 0;

-- 2) Ensure every auth user has a profile row (idempotent)
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

-- 3) Backfill fields from auth.users for existing profile rows
update public.profiles p
set
  role = coalesce(nullif(lower(u.raw_user_meta_data->>'role'), ''), p.role, 'customer'),
  name = coalesce(nullif(u.raw_user_meta_data->>'name', ''), p.name),
  email = coalesce(u.email, p.email),
  phone = coalesce(nullif(u.raw_user_meta_data->>'phone', ''), p.phone),
  address = coalesce(nullif(u.raw_user_meta_data->>'address', ''), p.address)
from auth.users u
where u.id = p.id;

-- 4) Backfill products_count in one aggregate query
update public.profiles p
set products_count = coalesce(t.cnt, 0)
from (
  select customer_id, count(*)::int as cnt
  from public.customer_products
  group by customer_id
) t
where t.customer_id = p.id;

-- 5) Trigger to maintain products_count
create or replace function public.sync_profiles_products_count()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles
      set products_count = products_count + 1
      where id = new.customer_id;
    return new;
  end if;

  if (tg_op = 'DELETE') then
    update public.profiles
      set products_count = greatest(products_count - 1, 0)
      where id = old.customer_id;
    return old;
  end if;

  -- UPDATE (handle customer_id change)
  if (tg_op = 'UPDATE') then
    if (new.customer_id <> old.customer_id) then
      update public.profiles
        set products_count = products_count + 1
        where id = new.customer_id;
      update public.profiles
        set products_count = greatest(products_count - 1, 0)
        where id = old.customer_id;
    end if;
    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists customer_products_sync_profiles_products_count on public.customer_products;
create trigger customer_products_sync_profiles_products_count
  after insert or delete or update of customer_id
  on public.customer_products
  for each row
  execute function public.sync_profiles_products_count();

-- 6) Admin/engineer can list all profiles (required for fast admin pages)
drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all" on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and lower(me.role) in ('admin', 'engineer')
    )
  );

