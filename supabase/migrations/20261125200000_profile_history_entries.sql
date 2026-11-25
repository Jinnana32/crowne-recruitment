-- Work experience and education entries for a candidate profile (D-013).
-- One candidate has many entries. Dates are stored as the first day of the month.
-- Grants below name each Crowne table. Do not grant on all tables in public.

create table if not exists public.crowne_candidate_work_experience (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.crowne_candidates (id) on delete cascade,
  job_title text not null check (char_length(job_title) between 1 and 120),
  employer_name text not null check (char_length(employer_name) between 1 and 160),
  country text check (country is null or char_length(country) <= 80),
  start_month date not null,
  end_month date,
  is_current boolean not null default false,
  description text check (description is null or char_length(description) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crowne_work_experience_end_check check (
    (is_current and end_month is null)
    or (not is_current and end_month is not null and end_month >= start_month)
  )
);

create table if not exists public.crowne_candidate_education (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.crowne_candidates (id) on delete cascade,
  qualification text not null check (char_length(qualification) between 1 and 120),
  school text not null check (char_length(school) between 1 and 160),
  field_of_study text check (field_of_study is null or char_length(field_of_study) <= 120),
  start_month date not null,
  end_month date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crowne_education_end_check check (
    (is_current and end_month is null)
    or (not is_current and end_month is not null and end_month >= start_month)
  )
);

create index if not exists crowne_candidate_work_experience_candidate_idx
  on public.crowne_candidate_work_experience (candidate_id);
create index if not exists crowne_candidate_education_candidate_idx
  on public.crowne_candidate_education (candidate_id);

alter table public.crowne_candidate_work_experience enable row level security;
alter table public.crowne_candidate_education enable row level security;

drop policy if exists crowne_work_experience_own_or_staff on public.crowne_candidate_work_experience;
create policy crowne_work_experience_own_or_staff on public.crowne_candidate_work_experience
  for all using (
    public.crowne_is_staff()
    or exists (
      select 1 from public.crowne_candidates
      where crowne_candidates.id = crowne_candidate_work_experience.candidate_id
        and crowne_candidates.profile_id = auth.uid()
    )
  )
  with check (
    public.crowne_is_staff()
    or exists (
      select 1 from public.crowne_candidates
      where crowne_candidates.id = crowne_candidate_work_experience.candidate_id
        and crowne_candidates.profile_id = auth.uid()
    )
  );

drop policy if exists crowne_education_own_or_staff on public.crowne_candidate_education;
create policy crowne_education_own_or_staff on public.crowne_candidate_education
  for all using (
    public.crowne_is_staff()
    or exists (
      select 1 from public.crowne_candidates
      where crowne_candidates.id = crowne_candidate_education.candidate_id
        and crowne_candidates.profile_id = auth.uid()
    )
  )
  with check (
    public.crowne_is_staff()
    or exists (
      select 1 from public.crowne_candidates
      where crowne_candidates.id = crowne_candidate_education.candidate_id
        and crowne_candidates.profile_id = auth.uid()
    )
  );

revoke all on table public.crowne_candidate_work_experience from anon;
revoke all on table public.crowne_candidate_education from anon;
grant select, insert, update, delete on table public.crowne_candidate_work_experience to authenticated;
grant select, insert, update, delete on table public.crowne_candidate_education to authenticated;
