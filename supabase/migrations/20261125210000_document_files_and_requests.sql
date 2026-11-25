-- Private document files, staff document requests, and a document access log. See D-014.
-- The accepted file types and the 10 MB limit are provisional until Crowne confirms them.

create table if not exists public.crowne_document_requests (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.crowne_candidates (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 300),
  sensitivity text not null default 'standard' check (sensitivity in ('standard', 'medical')),
  requested_by uuid references public.crowne_profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists crowne_document_requests_candidate_idx
  on public.crowne_document_requests (candidate_id, created_at);

alter table public.crowne_candidate_documents
  add column if not exists request_id uuid references public.crowne_document_requests (id) on delete set null,
  add column if not exists original_filename text,
  add column if not exists mime_type text check (mime_type is null or mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  add column if not exists size_bytes bigint check (size_bytes is null or (size_bytes > 0 and size_bytes <= 10485760)),
  add column if not exists uploaded_by uuid references public.crowne_profiles (id);

create index if not exists crowne_candidate_documents_candidate_idx
  on public.crowne_candidate_documents (candidate_id, uploaded_at);

create table if not exists public.crowne_document_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.crowne_candidates (id) on delete cascade,
  document_id uuid,
  action text not null check (action in ('uploaded', 'opened', 'deleted', 'verified', 'requested', 'request_removed')),
  actor_id uuid not null default auth.uid() references public.crowne_profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists crowne_document_events_candidate_idx
  on public.crowne_document_events (candidate_id, created_at);

create or replace function public.crowne_owns_candidate(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crowne_candidates
    where id = target
      and profile_id = auth.uid()
  );
$$;

-- Storage policies run on every bucket in this shared project, so the folder is
-- compared as text. A uuid cast would raise on another app's object names.
create or replace function public.crowne_owns_candidate_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crowne_candidates
    where id::text = folder
      and profile_id = auth.uid()
  );
$$;

revoke all on function public.crowne_owns_candidate(uuid) from public;
revoke all on function public.crowne_owns_candidate_folder(text) from public;
grant execute on function public.crowne_owns_candidate(uuid) to authenticated;
grant execute on function public.crowne_owns_candidate_folder(text) to authenticated;

alter table public.crowne_document_requests enable row level security;
alter table public.crowne_document_events enable row level security;

drop policy if exists crowne_document_requests_read on public.crowne_document_requests;
create policy crowne_document_requests_read on public.crowne_document_requests
  for select using (public.crowne_is_staff() or public.crowne_owns_candidate(candidate_id));

drop policy if exists crowne_document_requests_staff_write on public.crowne_document_requests;
create policy crowne_document_requests_staff_write on public.crowne_document_requests
  for all using (public.crowne_is_staff()) with check (public.crowne_is_staff());

-- Applicants see the metadata of every file they submitted, including medical files.
-- Opening a medical file is controlled by the storage policies below.
drop policy if exists crowne_documents_own_or_staff on public.crowne_candidate_documents;
create policy crowne_documents_own_or_staff on public.crowne_candidate_documents
  for select using (
    public.crowne_owns_candidate(candidate_id)
    or (sensitivity = 'standard' and public.crowne_is_staff())
    or (sensitivity = 'medical' and public.crowne_can_read_medical())
  );

drop policy if exists crowne_documents_insert_own on public.crowne_candidate_documents;
create policy crowne_documents_insert_own on public.crowne_candidate_documents
  for insert
  with check (
    public.crowne_owns_candidate(candidate_id)
    and status = 'For review'
    and uploaded_by = auth.uid()
  );

drop policy if exists crowne_documents_delete_own on public.crowne_candidate_documents;
create policy crowne_documents_delete_own on public.crowne_candidate_documents
  for delete using (
    public.crowne_owns_candidate(candidate_id)
    and sensitivity = 'standard'
    and status = 'For review'
  );

drop policy if exists crowne_documents_staff_review on public.crowne_candidate_documents;
create policy crowne_documents_staff_review on public.crowne_candidate_documents
  for update
  using (
    (sensitivity = 'standard' and public.crowne_is_staff())
    or (sensitivity = 'medical' and public.crowne_can_read_medical())
  )
  with check (
    status in ('For review', 'Verified')
    and (
      (sensitivity = 'standard' and public.crowne_is_staff())
      or (sensitivity = 'medical' and public.crowne_can_read_medical())
    )
  );

drop policy if exists crowne_document_events_insert on public.crowne_document_events;
create policy crowne_document_events_insert on public.crowne_document_events
  for insert
  with check (
    actor_id = auth.uid()
    and (public.crowne_is_staff() or public.crowne_owns_candidate(candidate_id))
  );

drop policy if exists crowne_document_events_staff_read on public.crowne_document_events;
create policy crowne_document_events_staff_read on public.crowne_document_events
  for select using (public.crowne_is_staff());

revoke all on table public.crowne_document_requests from anon;
revoke all on table public.crowne_document_events from anon;
grant select, insert, update, delete on table public.crowne_document_requests to authenticated;
grant select, insert on table public.crowne_document_events to authenticated;

-- Object names are <candidate id>/<standard|medical>/<random id>.<ext>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crowne-candidate-documents', 'crowne-candidate-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists crowne_document_objects_insert on storage.objects;
create policy crowne_document_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'crowne-candidate-documents'
    and (storage.foldername(name))[2] in ('standard', 'medical')
    and public.crowne_owns_candidate_folder((storage.foldername(name))[1])
  );

drop policy if exists crowne_document_objects_read on storage.objects;
create policy crowne_document_objects_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'crowne-candidate-documents'
    and (
      (
        (storage.foldername(name))[2] = 'standard'
        and (public.crowne_is_staff() or public.crowne_owns_candidate_folder((storage.foldername(name))[1]))
      )
      or ((storage.foldername(name))[2] = 'medical' and public.crowne_can_read_medical())
    )
  );

drop policy if exists crowne_document_objects_delete on storage.objects;
create policy crowne_document_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'crowne-candidate-documents'
    and (storage.foldername(name))[2] = 'standard'
    and public.crowne_owns_candidate_folder((storage.foldername(name))[1])
  );
