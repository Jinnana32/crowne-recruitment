-- Initial baseline from the documented domain model.
-- This is not a client-approved final schema. Open questions still apply.
-- Demo names and salaries are not inserted here.
-- Tables are prefixed crowne_ because this project is shared. See D-011.
-- Grants below name each Crowne table. Do not grant on all tables in public.

create extension if not exists pgcrypto;

create table if not exists public.crowne_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'applicant' check (role in ('applicant', 'staff')),
  staff_role text check (staff_role in ('super_admin', 'admin', 'recruitment', 'processing', 'deployment', 'finance', 'accounting', 'management')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crowne_employers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  status text not null default 'Active',
  contact_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crowne_job_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  employer_id uuid not null references public.crowne_employers (id),
  title text not null,
  country text not null,
  vacancies integer not null check (vacancies >= 0),
  status text not null default 'Recruiting',
  channels text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crowne_job_publications (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references public.crowne_job_orders (id),
  title text not null,
  category text,
  employment_type text,
  salary_label text,
  description text,
  qualifications jsonb not null default '[]',
  responsibilities jsonb not null default '[]',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crowne_candidates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.crowne_profiles (id),
  reference text not null unique,
  full_name text not null,
  email text,
  status text not null default 'Active',
  source text,
  mobile text,
  date_of_birth date,
  nationality text,
  preferred_role text,
  experience text,
  education text,
  languages text,
  preferred_destination text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crowne_applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  candidate_id uuid not null references public.crowne_candidates (id),
  job_order_id uuid not null references public.crowne_job_orders (id),
  publication_id uuid references public.crowne_job_publications (id),
  stage text not null,
  source text,
  applied_on date not null default current_date,
  recruiter text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, publication_id)
);

create table if not exists public.crowne_application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.crowne_applications (id),
  previous_stage text,
  new_stage text not null,
  actor_id uuid references public.crowne_profiles (id),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.crowne_processing_records (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  application_id uuid not null unique references public.crowne_applications (id),
  next_action text,
  status text not null default 'In progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crowne_processing_checklist_items (
  id uuid primary key default gen_random_uuid(),
  processing_record_id uuid not null references public.crowne_processing_records (id) on delete cascade,
  label text not null,
  state text not null,
  sensitivity text not null default 'standard' check (sensitivity in ('standard', 'medical')),
  created_at timestamptz not null default now()
);

create table if not exists public.crowne_deployment_records (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  application_id uuid not null references public.crowne_applications (id),
  departure_date date,
  travel_status text,
  readiness text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crowne_financial_transactions (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  description text not null,
  related_record text,
  recorded_on date not null,
  amount numeric(14, 2) not null,
  currency text not null,
  status text not null,
  kind text not null check (kind in ('income', 'expense')),
  created_at timestamptz not null default now()
);

create table if not exists public.crowne_candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.crowne_candidates (id),
  name text not null,
  storage_path text,
  status text not null default 'For review',
  sensitivity text not null default 'standard' check (sensitivity in ('standard', 'medical')),
  uploaded_at timestamptz not null default now()
);

create or replace function public.crowne_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crowne_profiles
    where id = auth.uid()
      and role = 'staff'
  );
$$;

create or replace function public.crowne_can_read_medical()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crowne_profiles
    where id = auth.uid()
      and role = 'staff'
      and staff_role in ('super_admin', 'admin', 'processing')
  );
$$;

create or replace function public.crowne_can_read_finance()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crowne_profiles
    where id = auth.uid()
      and role = 'staff'
      and staff_role in ('super_admin', 'admin', 'finance', 'accounting', 'management')
  );
$$;

alter table public.crowne_profiles enable row level security;
alter table public.crowne_employers enable row level security;
alter table public.crowne_job_orders enable row level security;
alter table public.crowne_job_publications enable row level security;
alter table public.crowne_candidates enable row level security;
alter table public.crowne_applications enable row level security;
alter table public.crowne_application_status_history enable row level security;
alter table public.crowne_processing_records enable row level security;
alter table public.crowne_processing_checklist_items enable row level security;
alter table public.crowne_deployment_records enable row level security;
alter table public.crowne_financial_transactions enable row level security;
alter table public.crowne_candidate_documents enable row level security;

drop policy if exists crowne_profiles_select_own_or_staff on public.crowne_profiles;
create policy crowne_profiles_select_own_or_staff on public.crowne_profiles
  for select using (id = auth.uid() or public.crowne_is_staff());

drop policy if exists crowne_employers_staff on public.crowne_employers;
create policy crowne_employers_staff on public.crowne_employers
  for all using (public.crowne_is_staff()) with check (public.crowne_is_staff());

drop policy if exists crowne_job_orders_staff on public.crowne_job_orders;
create policy crowne_job_orders_staff on public.crowne_job_orders
  for all using (public.crowne_is_staff()) with check (public.crowne_is_staff());

drop policy if exists crowne_publications_public_read on public.crowne_job_publications;
create policy crowne_publications_public_read on public.crowne_job_publications
  for select using (published = true or public.crowne_is_staff());

drop policy if exists crowne_publications_staff_write on public.crowne_job_publications;
create policy crowne_publications_staff_write on public.crowne_job_publications
  for all using (public.crowne_is_staff()) with check (public.crowne_is_staff());

drop policy if exists crowne_candidates_own_or_staff on public.crowne_candidates;
create policy crowne_candidates_own_or_staff on public.crowne_candidates
  for select using (profile_id = auth.uid() or public.crowne_is_staff());

drop policy if exists crowne_candidates_staff_write on public.crowne_candidates;
create policy crowne_candidates_staff_write on public.crowne_candidates
  for all using (public.crowne_is_staff() or profile_id = auth.uid())
  with check (public.crowne_is_staff() or profile_id = auth.uid());

drop policy if exists crowne_applications_own_or_staff on public.crowne_applications;
create policy crowne_applications_own_or_staff on public.crowne_applications
  for select using (
    public.crowne_is_staff()
    or exists (
      select 1 from public.crowne_candidates
      where crowne_candidates.id = crowne_applications.candidate_id
        and crowne_candidates.profile_id = auth.uid()
    )
  );

drop policy if exists crowne_applications_insert_own on public.crowne_applications;
create policy crowne_applications_insert_own on public.crowne_applications
  for insert with check (
    exists (
      select 1 from public.crowne_candidates
      where crowne_candidates.id = crowne_applications.candidate_id
        and crowne_candidates.profile_id = auth.uid()
    )
    or public.crowne_is_staff()
  );

drop policy if exists crowne_applications_staff_update on public.crowne_applications;
create policy crowne_applications_staff_update on public.crowne_applications
  for update using (public.crowne_is_staff()) with check (public.crowne_is_staff());

drop policy if exists crowne_history_own_or_staff on public.crowne_application_status_history;
create policy crowne_history_own_or_staff on public.crowne_application_status_history
  for select using (
    public.crowne_is_staff()
    or exists (
      select 1
      from public.crowne_applications
      join public.crowne_candidates on crowne_candidates.id = crowne_applications.candidate_id
      where crowne_applications.id = crowne_application_status_history.application_id
        and crowne_candidates.profile_id = auth.uid()
    )
  );

drop policy if exists crowne_processing_staff on public.crowne_processing_records;
create policy crowne_processing_staff on public.crowne_processing_records
  for all using (public.crowne_is_staff()) with check (public.crowne_is_staff());

drop policy if exists crowne_checklist_standard_staff on public.crowne_processing_checklist_items;
create policy crowne_checklist_standard_staff on public.crowne_processing_checklist_items
  for select using (
    (sensitivity = 'standard' and public.crowne_is_staff())
    or (sensitivity = 'medical' and public.crowne_can_read_medical())
  );

drop policy if exists crowne_checklist_medical_write on public.crowne_processing_checklist_items;
create policy crowne_checklist_medical_write on public.crowne_processing_checklist_items
  for all using (
    (sensitivity = 'standard' and public.crowne_is_staff())
    or public.crowne_can_read_medical()
  )
  with check (
    (sensitivity = 'standard' and public.crowne_is_staff())
    or public.crowne_can_read_medical()
  );

drop policy if exists crowne_deployment_staff on public.crowne_deployment_records;
create policy crowne_deployment_staff on public.crowne_deployment_records
  for all using (public.crowne_is_staff()) with check (public.crowne_is_staff());

drop policy if exists crowne_finance_restricted on public.crowne_financial_transactions;
create policy crowne_finance_restricted on public.crowne_financial_transactions
  for all using (public.crowne_can_read_finance()) with check (public.crowne_can_read_finance());

drop policy if exists crowne_documents_own_or_staff on public.crowne_candidate_documents;
create policy crowne_documents_own_or_staff on public.crowne_candidate_documents
  for select using (
    (
      sensitivity = 'standard'
      and (
        public.crowne_is_staff()
        or exists (
          select 1 from public.crowne_candidates
          where crowne_candidates.id = crowne_candidate_documents.candidate_id
            and crowne_candidates.profile_id = auth.uid()
        )
      )
    )
    or (sensitivity = 'medical' and public.crowne_can_read_medical())
  );

revoke all on table public.crowne_profiles from anon;
revoke all on table public.crowne_employers from anon;
revoke all on table public.crowne_job_orders from anon;
revoke all on table public.crowne_job_publications from anon;
revoke all on table public.crowne_candidates from anon;
revoke all on table public.crowne_applications from anon;
revoke all on table public.crowne_application_status_history from anon;
revoke all on table public.crowne_processing_records from anon;
revoke all on table public.crowne_processing_checklist_items from anon;
revoke all on table public.crowne_deployment_records from anon;
revoke all on table public.crowne_financial_transactions from anon;
revoke all on table public.crowne_candidate_documents from anon;

grant select on table public.crowne_job_publications to anon;
grant select, insert, update, delete on table public.crowne_profiles to authenticated;
grant select, insert, update, delete on table public.crowne_employers to authenticated;
grant select, insert, update, delete on table public.crowne_job_orders to authenticated;
grant select, insert, update, delete on table public.crowne_job_publications to authenticated;
grant select, insert, update, delete on table public.crowne_candidates to authenticated;
grant select, insert, update, delete on table public.crowne_applications to authenticated;
grant select, insert, update, delete on table public.crowne_application_status_history to authenticated;
grant select, insert, update, delete on table public.crowne_processing_records to authenticated;
grant select, insert, update, delete on table public.crowne_processing_checklist_items to authenticated;
grant select, insert, update, delete on table public.crowne_deployment_records to authenticated;
grant select, insert, update, delete on table public.crowne_financial_transactions to authenticated;
grant select, insert, update, delete on table public.crowne_candidate_documents to authenticated;

revoke all on function public.crowne_is_staff() from public;
revoke all on function public.crowne_can_read_medical() from public;
revoke all on function public.crowne_can_read_finance() from public;
grant execute on function public.crowne_is_staff() to anon, authenticated;
grant execute on function public.crowne_can_read_medical() to authenticated;
grant execute on function public.crowne_can_read_finance() to authenticated;
