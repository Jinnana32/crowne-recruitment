-- Returns application cards without exposing employer contact details.
-- Staff see every application. An applicant sees only their own.

create or replace function public.crowne_visible_applications()
returns table (
  id uuid,
  reference text,
  candidate_id uuid,
  candidate_name text,
  job_title text,
  country text,
  employer text,
  stage text,
  source text,
  applied_on date,
  recruiter text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    application.id,
    application.reference,
    application.candidate_id,
    candidate.full_name,
    job_order.title,
    job_order.country,
    employer.name,
    application.stage,
    application.source,
    application.applied_on,
    application.recruiter
  from public.crowne_applications as application
  join public.crowne_candidates as candidate on candidate.id = application.candidate_id
  join public.crowne_job_orders as job_order on job_order.id = application.job_order_id
  join public.crowne_employers as employer on employer.id = job_order.employer_id
  where public.crowne_is_staff()
    or candidate.profile_id = auth.uid()
$$;

revoke all on function public.crowne_visible_applications() from public;
grant execute on function public.crowne_visible_applications() to authenticated;
