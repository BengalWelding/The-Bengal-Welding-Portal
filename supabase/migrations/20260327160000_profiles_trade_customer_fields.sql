-- Add trade-customer fields to profiles for admin customer management.
-- Idempotent migration: safe to run multiple times.

alter table public.profiles
  add column if not exists company_name text,
  add column if not exists vat_number text,
  add column if not exists account_type text,
  add column if not exists balance numeric(12,2) not null default 0,
  add column if not exists customer_type text,
  add column if not exists completed boolean not null default false;

-- Keep enum-like values constrained.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_account_type_check
      check (account_type is null or lower(account_type) in ('credit', 'cash'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_customer_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_customer_type_check
      check (customer_type is null or lower(customer_type) in ('trade', 'retail'));
  end if;
end $$;

-- Normalize any legacy values into the supported set.
update public.profiles
set account_type = null
where account_type is not null
  and lower(account_type) not in ('credit', 'cash');

update public.profiles
set customer_type = null
where customer_type is not null
  and lower(customer_type) not in ('trade', 'retail');

update public.profiles
set
  account_type = lower(account_type),
  customer_type = lower(customer_type)
where account_type is not null
   or customer_type is not null;

-- Backfill from auth metadata when present.
update public.profiles p
set
  company_name = coalesce(nullif(u.raw_user_meta_data->>'company_name', ''), p.company_name),
  vat_number = coalesce(nullif(u.raw_user_meta_data->>'vat_number', ''), p.vat_number),
  account_type = coalesce(
    case
      when lower(coalesce(u.raw_user_meta_data->>'account_type', '')) in ('credit', 'cash')
        then lower(u.raw_user_meta_data->>'account_type')
      else null
    end,
    p.account_type
  ),
  balance = coalesce(
    case
      when coalesce(u.raw_user_meta_data->>'balance', '') ~ '^-?\d+(\.\d+)?$'
        then (u.raw_user_meta_data->>'balance')::numeric(12,2)
      else null
    end,
    p.balance,
    0
  ),
  customer_type = coalesce(
    case
      when lower(coalesce(u.raw_user_meta_data->>'customer_type', '')) in ('trade', 'retail')
        then lower(u.raw_user_meta_data->>'customer_type')
      else null
    end,
    p.customer_type
  ),
  completed = coalesce(
    case
      when lower(coalesce(u.raw_user_meta_data->>'completed', '')) in ('true', 'false')
        then (u.raw_user_meta_data->>'completed')::boolean
      else null
    end,
    p.completed,
    false
  )
from auth.users u
where u.id = p.id;
