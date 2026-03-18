-- Allow engineers to view jobs in addition to admins and job-owning customers.
-- This aligns DB access with UI routing where engineers use the admin job views.

drop policy if exists "jobs_select" on public.jobs;

create policy "jobs_select"
on public.jobs
for select
using (
  customer_id = auth.uid()::text
  or public.is_admin_or_engineer()
);
