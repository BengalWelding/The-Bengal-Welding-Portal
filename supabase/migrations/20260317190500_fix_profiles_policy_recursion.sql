-- Fix infinite recursion in profiles RLS policy by using a SECURITY DEFINER helper.

-- Helper: checks current user's role without triggering profiles RLS recursion.
create or replace function public.is_admin_or_engineer()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare r text;
begin
  -- Bypass RLS for this lookup only.
  perform set_config('row_security', 'off', true);

  select lower(role) into r
  from public.profiles
  where id = auth.uid();

  return r in ('admin', 'engineer');
end;
$$;

-- Replace recursive admin select policy
drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all" on public.profiles
  for select
  using (public.is_admin_or_engineer());

