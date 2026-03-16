-- Add account_number to profiles for human-friendly customer IDs
alter table public.profiles
  add column if not exists account_number text;

create unique index if not exists profiles_account_number_key
  on public.profiles (account_number)
  where account_number is not null;

-- Customer products / contracts table
create table if not exists public.customer_products (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  catalog_product_code text,
  label text not null,
  purchase_date date not null,
  warranty_start date not null,
  warranty_end date not null,
  serial_number text,
  installation_site_id uuid references public.installation_sites(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_products
  enable row level security;

-- Ensure updated_at tracks changes
create or replace function public.set_customer_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists customer_products_set_updated_at
  on public.customer_products;

create trigger customer_products_set_updated_at
  before update on public.customer_products
  for each row
  execute function public.set_customer_products_updated_at();

-- RLS: customers can see and manage their own products
drop policy if exists "customer_products_select_own" on public.customer_products;
create policy "customer_products_select_own"
  on public.customer_products
  for select
  using (
    auth.uid() = customer_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.role) in ('admin', 'engineer')
    )
  );

drop policy if exists "customer_products_insert_own" on public.customer_products;
create policy "customer_products_insert_own"
  on public.customer_products
  for insert
  with check (
    auth.uid() = customer_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.role) in ('admin', 'engineer')
    )
  );

drop policy if exists "customer_products_update_own" on public.customer_products;
create policy "customer_products_update_own"
  on public.customer_products
  for update
  using (
    auth.uid() = customer_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.role) in ('admin', 'engineer')
    )
  )
  with check (
    auth.uid() = customer_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.role) in ('admin', 'engineer')
    )
  );

drop policy if exists "customer_products_delete_own" on public.customer_products;
create policy "customer_products_delete_own"
  on public.customer_products
  for delete
  using (
    auth.uid() = customer_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.role) in ('admin', 'engineer')
    )
  );

