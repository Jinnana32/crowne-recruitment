# Implementation Milestones

Build in vertical slices. Do not attempt to implement every module simultaneously. Each milestone has a reviewable outcome and must meet its exit criteria before dependent work begins.

## Current build

As of 2026-11-25 the working slice is live on the shared Supabase project: a staff profile can publish and edit a job, an applicant can register and apply, and staff can move that application’s stage. Crowne tables use the `crowne_` prefix from D-011. Generated types are in `src/lib/supabase/database.types.ts`. `tests/rls-isolation.test.ts` proves one applicant cannot read another applicant’s profile, application, or documents. App-boundary auth checks (session route, protected pages, and a user with no `crowne_profiles` row) are deferred. A rendered screen does not by itself meet a milestone exit criterion.

| Milestone | State |
|---|---|
| M0 Foundation | Done. The app starts, docs and scripts are in place, and secrets stay out of git. |
| M1 Identity | Database, clients, migrations, generated types, and cross-applicant RLS are in place. Session-route and protected-route tests are deferred. Password recovery waits on an email provider. Staff roles stay the provisional list. |
| M2 UI foundation | shadcn layouts, Crowne colors, and React Query are in place. |
| M3 Job orders | Staff can create, edit, and hide a listing. Approval and the vacancy-counting rule are unconfirmed. |
| M4 Public jobs | Only published jobs are public, and search works. Destination and category filters still use the prototype lists. |
| M5 Applicant profile | Register, sign in, profile update, work/education entries, and private document upload work. File types/size stay provisional (D-014). Password recovery still waits on email. |
| M6 Pipeline | Apply, reject a duplicate, and change stage with a history row. Assignment, interviews, and a fuller audit are open. |
| M7 Processing | Selected applications open a provisional checklist. Staff can update items and mark ready. Country/employer configuration is still open. |
| M8 Deployment | Ready processing can schedule a departure. Ticket confirmation works. Clearance/visa detail capture is still open. |
| M9 Finance | Amounts can be stored. Demo posts provisional medical expense and placement fee from the processing bridge. Invoices/receipts are not built. |
| M10 Reporting | Overview and Reports count processing, ready, departures, and finance from live records. Filtered exports and a permission review are open. |
| M11 Integrations | Candidate CSV import exists. Email, background jobs, and a WorkAbroad API are not built. |
| M12 Release | Not started. |

## M0 — Repository audit and project foundation

**Work**
- Inspect repository, package manager, installed versions, scripts, existing code, and deployment setup.
- Confirm Next.js, React, Tailwind, shadcn/ui, TanStack Query, Supabase packages.
- Establish folder conventions and environment variable handling.
- Add documentation and design references.
- Configure lint, typecheck, and build scripts.

**Exit criteria**
- Existing repository state documented.
- App starts locally.
- No secrets committed.
- Guardrail docs are available to agents.
- Lint/typecheck/build status recorded.

## M1 — Supabase foundation and identity

**Work**
- Create/verify Supabase project and local CLI workflow.
- Establish migrations and generated database types.
- Implement browser/server Supabase clients using supported SSR pattern.
- Configure auth flows and session handling.
- Define staff/applicant identity model and initial role/permission proposal.
- Add RLS baseline and tests before exposing tables.

**Exit criteria**
- Applicant and staff authentication paths are defined and tested.
- Protected route and API access is enforced.
- RLS tests prove cross-applicant data isolation.
- Migrations are reproducible.

## M2 — Shared UI foundation

**Work**
- Configure shadcn/ui and Crowne theme tokens.
- Implement public, applicant, and agency layouts.
- Add React Query provider and query defaults.
- Establish API response/error conventions.
- Implement shared form, table, status, loading, empty, and error patterns.

**Exit criteria**
- Three layouts render responsively.
- Theme tokens are centralized.
- React Query works with a test API route.
- No server actions used for application mutations.

## M3 — Employers and job orders

**Work**
- Confirm employer, job order, position, vacancy, requirement, and approval data model.
- Implement employer and job-order admin flows.
- Add server validation, authorization, RLS, and audit events.
- Track vacancy capacity and approval status according to confirmed business rules.

**Exit criteria**
- Authorized staff can create/edit/view job orders.
- Unauthorized users cannot access restricted records.
- Capacity calculations follow approved rules and have tests.

## M4 — Public job marketplace

**Work**
- Public job listing, filters, job detail, publication status.
- Agency website as a first-class recruitment channel.
- Job publication records separate from job orders.
- SEO/public visibility and content approval rules.

**Exit criteria**
- Only approved, published jobs are public.
- Search/filter works.
- Draft/unpublished jobs are not exposed.

## M5 — Applicant registration and profile

**Work**
- Applicant registration/login/recovery as approved.
- Candidate profile and profile completion.
- Applicant portal navigation.
- Private document upload and metadata.

**Exit criteria**
- Applicant can access only their own data.
- Profile updates are validated.
- Private documents cannot be accessed by another applicant.
- Sensitive document access is restricted and auditable.

## M6 — Applications and recruitment pipeline

**Work**
- Application submission from public jobs.
- Candidate-to-application relationship.
- Source attribution.
- Application status and append-only history.
- Staff application list, filters, assignment, screening, interviews, employer review, selection decisions.

**Exit criteria**
- Duplicate submission behavior is defined and tested.
- One candidate can have multiple applications.
- Each application has independent status/history.
- Staff actions are authorized and audited.
- Applicant sees only applicant-safe updates.

## M7 — Processing and onboarding

**Work**
- Configurable checklists and requirements.
- Document review and expiry.
- Restricted medical workflow.
- Contract/orientation/approval tracking.

**Exit criteria**
- Requirements can vary by approved configuration.
- Incomplete mandatory items block ready-for-deployment.
- Medical access tests prove least privilege.

## M8 — Deployment

**Work**
- Deployment records, applicable clearance references, visa/travel details, departure, deployed worker tracking, post-deployment follow-up.

**Exit criteria**
- Only eligible selected/processed candidates can enter deployment according to approved rules.
- Deployment history is auditable.
- System does not claim to perform official government approvals.

## M9 — Operational finance

**Work**
- Transactions, expense submission/review, receipt attachments, invoices, payments, allocations, outstanding balances.
- Link records to employer/job order/candidate where appropriate.
- Confirm accounting scope before adding ledger/accounting features.

**Exit criteria**
- Amounts use decimal types and explicit currency.
- Approval and payment history is auditable.
- Restricted finance access is enforced.
- Candidate payer responsibility is never assumed.

## M10 — Reporting and management dashboard

**Work**
- Recruitment, job order fulfillment, processing, deployment, and operational finance metrics.
- Date/employer/country/job-order filters.
- Export permissions and privacy review.

**Exit criteria**
- Metrics reconcile to source records.
- Exports enforce permissions.
- No fake/demo metrics in production.

## M11 — Integrations and automation

**Work**
- WorkAbroad import/integration only after vendor capability verification.
- CSV import/export and deduplication review.
- Email notifications and approved reminders.
- Durable background jobs for long-running tasks.

**Exit criteria**
- Integration limitations are documented.
- Imports are validated, traceable, and retry-safe.
- No invented API or webhook assumptions.

## M12 — QA, release, and operations

**Work**
- End-to-end workflow testing.
- Permission/RLS review.
- Performance, accessibility, backup/recovery, monitoring, and deployment runbook.
- Production data migration plan and staff onboarding.

**Exit criteria**
- Critical journeys pass end-to-end.
- Security tests pass.
- Backup/recovery procedure is verified.
- Known limitations and operational owners are documented.

## End-to-end acceptance journey

Create employer → create/approve job order → publish job → applicant registers → completes profile → applies → application appears in staff pipeline → recruiter screens/interviews → employer selection → processing requirements → contract/orientation → deployment readiness → departure record → finance transaction/invoice/payment → management reporting.

This journey is a target acceptance scenario, not permission to invent missing workflow details.
