-- Lets an applicant create only their own applicant profile, exposes published
-- jobs without opening staff tables to anonymous reads, and records stage changes.
-- See D-012. This does not confirm Crowne's staff role list.

drop policy if exists crowne_profiles_insert_self on public.crowne_profiles;
create policy crowne_profiles_insert_self on public.crowne_profiles
  for insert
  with check (id = auth.uid() and role = 'applicant' and staff_role is null);

drop policy if exists crowne_profiles_update_self on public.crowne_profiles;
create policy crowne_profiles_update_self on public.crowne_profiles
  for update
  using (id = auth.uid() and role = 'applicant')
  with check (id = auth.uid() and role = 'applicant' and staff_role is null);

drop policy if exists crowne_history_insert_participant on public.crowne_application_status_history;
create policy crowne_history_insert_participant on public.crowne_application_status_history
  for insert
  with check (
    public.crowne_is_staff()
    or exists (
      select 1
      from public.crowne_applications
      join public.crowne_candidates on crowne_candidates.id = crowne_applications.candidate_id
      where crowne_applications.id = application_id
        and crowne_candidates.profile_id = auth.uid()
    )
  );

drop policy if exists crowne_documents_insert_own on public.crowne_candidate_documents;
create policy crowne_documents_insert_own on public.crowne_candidate_documents
  for insert
  with check (
    sensitivity = 'standard'
    and exists (
      select 1
      from public.crowne_candidates
      where crowne_candidates.id = candidate_id
        and crowne_candidates.profile_id = auth.uid()
    )
  );

create or replace function public.crowne_list_public_jobs(job_id uuid default null)
returns table (
  id uuid,
  title text,
  employer text,
  country text,
  category text,
  vacancies integer,
  employment_type text,
  salary_label text,
  job_order_reference text,
  description text,
  qualifications jsonb,
  responsibilities jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    publication.id,
    publication.title,
    employer.name,
    job_order.country,
    publication.category,
    job_order.vacancies,
    publication.employment_type,
    publication.salary_label,
    job_order.reference,
    publication.description,
    publication.qualifications,
    publication.responsibilities
  from public.crowne_job_publications as publication
  join public.crowne_job_orders as job_order on job_order.id = publication.job_order_id
  join public.crowne_employers as employer on employer.id = job_order.employer_id
  where publication.published = true
    and (job_id is null or publication.id = job_id)
$$;

create or replace function public.crowne_published_job_order_id(publication_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select job_order_id
  from public.crowne_job_publications
  where id = publication_id
    and published = true
$$;

revoke all on function public.crowne_list_public_jobs(uuid) from public;
revoke all on function public.crowne_published_job_order_id(uuid) from public;
grant execute on function public.crowne_list_public_jobs(uuid) to anon, authenticated;
grant execute on function public.crowne_published_job_order_id(uuid) to authenticated;
