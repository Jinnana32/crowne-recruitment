# Database Standards and Domain Model

## 1. Source of truth

Supabase PostgreSQL is the source of truth for persistent application data. Database changes must be delivered as ordered SQL migrations in `supabase/migrations/`.

Never:
- Make undocumented dashboard-only schema changes.
- Edit an already-applied migration to change its historical effect.
- Use UI state as the source of truth for business records.
- Assume a table or column exists without inspecting migrations/database types.

## 2. Schema design rules

- Use UUID primary keys unless a documented domain reason requires otherwise.
- Include `created_at` and `updated_at` on mutable business entities.
- Use foreign keys and appropriate indexes.
- Use explicit constraints for required values and uniqueness.
- Use transactions for multi-step operations that must succeed/fail atomically.
- Use `timestamptz` for instants; store business-local dates as `date` when the concept is a calendar date.
- Use numeric/decimal types for money; never floating point.
- Store currency explicitly with monetary values.
- Prefer lookup/configuration tables or constrained values for configurable domains.
- Avoid overusing JSONB for core relational data. JSONB is appropriate for genuinely variable metadata, not as a replacement for queryable relationships.
- Define deletion/retention behavior before adding cascade deletes to important records.
- Preserve historical records for recruitment, approval, and financial auditability.

## 3. Domain entities to design

These are domain concepts, **not a final approved SQL schema**. Before creating tables, inspect the repository and produce a relationship diagram and migration plan.

| Concept | Purpose |
|---|---|
| User/profile | Authenticated identity and application profile |
| Role/permission | Staff access model |
| Employer | Foreign employer/client organization |
| Employer contact | Employer representatives |
| Job order | Approved manpower request |
| Job position | Role/position and vacancy count within a job order |
| Job requirement | Qualifications and conditions for a position |
| Job order document | Supporting documents |
| Job advertisement | Public-facing content derived from approved job information |
| Publication channel | Agency website, WorkAbroad, and future channels |
| Job publication | Channel-specific publication state and external reference |
| Candidate | Canonical applicant/person profile |
| Candidate document | Private candidate-submitted document metadata |
| Application | Candidate applying for a job position/job order |
| Application status history | Auditable status transitions |
| Interview/assessment | Recruitment evaluation activity |
| Processing record | Post-selection requirements workflow |
| Processing checklist item | Configurable required step and completion state |
| Medical record | Restricted sensitive medical information |
| Contract/onboarding | Contract and orientation records |
| Deployment record | Deployment preparation and outcome |
| Travel/clearance record | Relevant travel and clearance references |
| Financial transaction | Income/expense transaction |
| Receipt/attachment | Private supporting file metadata |
| Invoice/payment | Employer billing and payment tracking |
| Audit log | Important security and business events |

## 4. Critical relationship rules

- Employer 1 → many job orders.
- Job order 1 → many positions and requirements (exact modelling to be confirmed).
- Job order/position may have many advertisements/publications.
- Candidate 1 → many applications.
- Application belongs to one candidate and one specific advertised/job-order position context.
- Application 1 → many status history events.
- A selected application may lead to a processing record.
- A processing record may lead to a deployment record.
- Financial records may link to employer, job order, candidate, or another approved business entity without forcing every transaction to have all links.

## 5. Candidate and application identity

Do not store a separate candidate profile per job application. Candidate identity and application identity must remain separate.

Deduplication:
- Define matching strategy and human review before implementing merges.
- Do not automatically merge based only on name.
- Consider verified email/mobile and other approved identifiers, with privacy and access controls.
- Record merge/audit history if merge capability is implemented.

## 6. Status and history

For any workflow where status changes matter:
- Store current status on the owning record for efficient reads.
- Store append-only history with previous status, new status, actor, timestamp, and reason/metadata as appropriate.
- Validate allowed transitions in server-side domain logic.
- Do not allow clients to directly write arbitrary status values.

## 7. Files

Store file bytes in Supabase Storage, not as database blobs. Store metadata in PostgreSQL:
- owning entity and record ID
- storage bucket/path
- original filename and safe display name
- MIME type and size
- uploader and timestamp
- verification/review state where applicable
- expiry date if applicable

Use private buckets for candidate documents, medical documents, contracts, receipts, and other non-public files. Public job images/documents require explicit review.

## 8. Generated types

After migrations, regenerate types from the linked project:

```
supabase gen types typescript --linked --schema public
```

The project is shared, so keep only `crowne_` tables and functions in `src/lib/supabase/database.types.ts`. Do not commit types for tables owned by another application on the same project. Do not hand-maintain a second copy of those types, and do not invent types for tables that have not been migrated.

## 9. Initial migration

`supabase/migrations/20261125140000_initial_baseline.sql` is a technical baseline for the documented entities. It has been applied to the shared Supabase project configured in `.env.local`. Every table and helper function uses the `crowne_` prefix from D-011. The migration enables RLS on every Crowne table it creates and grants access only to those tables. Staff roles inside the policies are the unconfirmed proposal from `docs/SECURITY_AND_RLS.md`. Do not treat the migration as Crowne's approved schema, and do not insert prototype people into it.

The shared project already had migration versions `0001` through `0004`. The matching local files are history anchors so `supabase db push` can run. Do not repair, revert, or edit those versions. They are not Crowne schema.

`supabase/migrations/20261125183000_accounts_and_public_jobs.sql` lets an applicant insert only their own applicant profile, records application stage changes, and exposes published job fields through `crowne_list_public_jobs`.

`supabase/migrations/20261125190000_visible_applications.sql` adds `crowne_visible_applications`, which returns an application only to staff or to the applicant who owns it.

`supabase/migrations/20261125200000_profile_history_entries.sql` adds `crowne_candidate_work_experience` and `crowne_candidate_education` (D-013). Each row belongs to one candidate. `start_month` and `end_month` hold the first day of the month. A row is either `is_current` with no end month, or has an end month on or after the start. RLS allows the owning applicant and staff. `tests/rls-isolation.test.ts` checks that another applicant cannot read, add, or delete these rows.

`supabase/migrations/20261125210000_document_files_and_requests.sql` adds private file support (D-014): `crowne_document_requests`, file metadata columns on `crowne_candidate_documents`, `crowne_document_events`, ownership helpers, and the private `crowne-candidate-documents` storage bucket with folder policies for `standard` and `medical` paths.

## 10. Seed data

- Keep development/demo seed data clearly separate from production data.
- Do not include real applicant personal data, real passport/medical information, or secrets in seeds.
- Seed values from prototypes are fictional examples only.
