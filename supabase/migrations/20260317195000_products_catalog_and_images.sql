-- Product catalog (customer-facing) + product image storage bucket

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric not null default 0,
  price_min numeric null,
  price_max numeric null,
  image text not null,
  category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);

create or replace function public.set_products_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute procedure public.set_products_updated_at();

alter table public.products enable row level security;

-- Anyone signed-in can view products (customer catalog is behind auth).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'products_select_authenticated'
  ) then
    create policy "products_select_authenticated"
    on public.products for select
    to authenticated
    using (true);
  end if;
end;
$$;

-- Only admins can create/update/delete products.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'products_insert_admin'
  ) then
    create policy "products_insert_admin"
    on public.products for insert
    to authenticated
    with check (
      exists (select 1 from public.profiles where id = auth.uid() and lower(role) = 'admin')
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'products_update_admin'
  ) then
    create policy "products_update_admin"
    on public.products for update
    to authenticated
    using (
      exists (select 1 from public.profiles where id = auth.uid() and lower(role) = 'admin')
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'products_delete_admin'
  ) then
    create policy "products_delete_admin"
    on public.products for delete
    to authenticated
    using (
      exists (select 1 from public.profiles where id = auth.uid() and lower(role) = 'admin')
    );
  end if;
end;
$$;

-- Storage bucket for product images (public so customers can view images).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Storage policies:
-- - Anyone authenticated can read object metadata for product images
-- - Only admins can upload/update/delete
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_images_select'
  ) then
    create policy "product_images_select"
    on storage.objects for select
    to authenticated
    using (bucket_id = 'product-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_images_insert_admin'
  ) then
    create policy "product_images_insert_admin"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'product-images'
      and exists (select 1 from public.profiles where id = auth.uid() and lower(role) = 'admin')
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_images_update_admin'
  ) then
    create policy "product_images_update_admin"
    on storage.objects for update
    to authenticated
    using (
      bucket_id = 'product-images'
      and exists (select 1 from public.profiles where id = auth.uid() and lower(role) = 'admin')
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_images_delete_admin'
  ) then
    create policy "product_images_delete_admin"
    on storage.objects for delete
    to authenticated
    using (
      bucket_id = 'product-images'
      and exists (select 1 from public.profiles where id = auth.uid() and lower(role) = 'admin')
    );
  end if;
end;
$$;

