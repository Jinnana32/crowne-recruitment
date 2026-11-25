# Architecture and Product Decision Log

Record material decisions here. Newest decisions go at the top.

## D-017 — Destinations locked to Middle East for this demo

- **Date:** 2026-11-25
- **Status:** Accepted
- **Context:** Crowne asked to lock the country list to the Middle East for the current demo. Public job filters, job-order destination, and preferred destination used a mixed Asia/Middle East prototype list.
- **Decision:** Destination selectors use `MIDDLE_EAST_COUNTRIES`: United Arab Emirates, Saudi Arabia, Qatar, Kuwait, Bahrain, and Oman. Job opening/update validation and preferred destination accept only that list (or empty preferred destination). Work history country stays free-text because past employment is not a Crowne destination.
- **Alternatives considered:** Keep the mixed prototype list, or wait for Crowne’s full destination catalog.
- **Consequences:** Demo seed employers and job orders use Middle East destinations only. Expanding beyond this list needs a product update.

## D-016 — Demo bridge from Selected → Processing → Deployment → Finance

- **Date:** 2026-11-25
- **Status:** Accepted
- **Context:** M7/M8 screens existed as read-only shells. Selecting an applicant did not create a processing record, so Processing and Deployment stayed empty and could not support a demo path to deployed.
- **Decision:** Moving an application to Selected creates (or backfills) a `crowne_processing_records` row with a provisional Middle East checklist. Staff can toggle checklist states, mark Ready only when nothing is Pending, then schedule a departure (`crowne_deployment_records`). Passing medical posts a provisional PHP expense; scheduling departure posts a provisional employer placement fee. Overview and Reports count processing, ready, departures, and finance figures from the same records.
- **Alternatives considered:** Keep shells until Crowne confirms full checklists, or invent country-specific workflows now.
- **Consequences:** Checklist labels and fee amounts are demo-provisional. Crowne must still confirm real requirements, clearances, and fee rules. The platform still does not issue government approvals.

## D-015 — Staff CV download via Puppeteer PDF

- **Date:** 2026-11-25
- **Status:** Accepted
- **Context:** Agency staff need a downloadable candidate CV from the candidate profile page. The CV must be ATS-friendly so employers and screening tools can parse it.
- **Decision:** `GET /api/candidates/[candidateId]/cv` is staff-only. The server builds a single-column HTML CV from the candidate profile, work experience, and education, then Puppeteer prints it to PDF. The layout uses plain headings and paragraphs (no multi-column layout, tables-as-layout, or decorative graphics). Puppeteer stays a server-only dependency listed in `serverExternalPackages`.
- **Alternatives considered:** Client-side PDF libraries, or storing uploaded CV files only.
- **Consequences:** Chromium must be available in the runtime that serves the API route. Generation is on demand and is not stored. Applicant self-download of the same PDF is not included yet.

## D-014 — Private document files, staff requests, and access audit

- **Date:** 2026-11-25
- **Status:** Accepted
- **Context:** M5 requires private document upload. The applicant mock shows requested documents, a file dropzone, and uploaded files with review status. `docs/OPEN_QUESTIONS.md` still asks Crowne to confirm accepted types, size limits, and who may upload. Name-only records are not enough for recruitment review.
- **Decision:** Store file bytes in the private `crowne-candidate-documents` bucket. Keep metadata on `crowne_candidate_documents` (path, mime, size, original filename, status, sensitivity, optional `request_id`). Staff create rows on `crowne_document_requests`; applicants upload against a request or as a free file. Accepted types are PDF, JPG, and PNG up to 10 MB, validated from the file signature. Medical files are listed to the applicant but only admin and processing roles may open them. `crowne_document_events` records upload, open, delete, verify, and request actions. Applicants may delete only their own standard files that are still "For review".
- **Alternatives considered:** Keep name-only records, or put every file behind a staff-issued signed URL with no direct storage policy.
- **Consequences:** File type and size remain provisional until Crowne confirms them. Opening a medical file as an applicant returns restricted. Orphaned medical objects after a failed insert need staff cleanup because applicants cannot delete medical storage objects.

## D-013 — Work experience and education are separate entries

- **Date:** 2026-11-25
- **Status:** Accepted
- **Context:** The applicant profile mock for work experience and education shows several entries per section, each with its own employer or school, period, and details. The candidate row only had one short `experience` and one `education` text column.
- **Decision:** Add `crowne_candidate_work_experience` and `crowne_candidate_education`, one row per entry, linked to `crowne_candidates`. Months are stored as the first day of the month. An entry is either current (no end month) or has an end month on or after its start month, enforced in SQL and in Zod. Row level security lets the owning applicant and Crowne staff read and write. Applicants manage entries through `/api/profile/work-experience` and `/api/profile/education`. Profile completion counts each section once when it has at least one entry.
- **Alternatives considered:** A JSON array on `crowne_candidates`, which would skip per-entry constraints and make staff search harder.
- **Consequences:** The older `experience` and `education` columns stay so existing text is not lost. The profile screen shows that text as an earlier note the applicant can remove. It no longer counts toward completion. Deleting a candidate deletes their entries.

## D-012 — Account bootstrap and public job reads

- **Date:** 2026-11-25
- **Status:** Accepted
- **Context:** Crowne shares one Supabase Auth project. Applicants must not be able to grant themselves staff access. Anonymous visitors also must not receive employer contact details, while the careers site still needs published job fields.
- **Decision:** Public registration always writes `crowne_profiles.role` as `applicant`. The service-role key may create that profile only when sign-up has not established a session, and only for the Auth user id Supabase just returned. The first staff profile is created by `scripts/provision-staff.mjs`, not by the public form. `crowne_list_public_jobs` is a security-definer function that returns published job fields only.
- **Alternatives considered:** A trigger on every `auth.users` insert, or granting anonymous select on the staff tables.
- **Consequences:** A person from another app on this Supabase project does not become Crowne staff or an applicant unless Crowne writes a `crowne_profiles` row. Email confirmation and password recovery still follow the shared project's Auth settings.

## D-011 — Prefix Crowne tables on the shared Supabase project

- **Date:** 2026-11-25
- **Status:** Accepted
- **Context:** Crowne is connected to an existing Supabase project that already holds other applications. Unprefixed names such as `profiles` and `employers` could collide with those applications.
- **Decision:** Every Crowne table is named `crowne_` plus the entity name, for example `crowne_profiles` and `crowne_job_orders`. Helper functions use the same prefix. SQL grants name each Crowne table. They do not grant access to every table in `public`.
- **Alternatives considered:** A separate Supabase project, or a dedicated Postgres schema.
- **Consequences:** Auth users are still project-wide because Supabase has one `auth.users` table. Crowne identity lives in `crowne_profiles`. A person from another app has no Crowne access until that profile row exists. The illustrative dataset is still not inserted into these tables.

## D-009 — Illustrative data is local-only

- **Date:** 2026-11-25
- **Status:** Accepted
- **Context:** No Supabase project has been selected, and the screens still need records for review. Product rules forbid treating prototype content as live Crowne data.
- **Decision:** Without Supabase environment variables, non-production runs use an in-memory illustrative dataset. `DATA_SOURCE=demo` is rejected when `NODE_ENV` is production. A configured Supabase URL and anon key select the live source.
- **Alternatives considered:** Block every screen until a Supabase project exists, or seed the illustrative people into SQL.
- **Consequences:** Demo changes last only for the server process. The migration does not insert those people. Live reads still require the migration to be applied on the chosen project.

## D-010 — shadcn/ui uses the current Base UI preset

- **Date:** 2026-11-25
- **Status:** Accepted
- **Context:** shadcn 4.23 initializes new Next.js apps with the Base UI preset rather than Radix.
- **Decision:** Use the current shadcn Base UI components, restyled with the Crowne royal and gold tokens from `docs/UI_DESIGN_SYSTEM.md`.
- **Alternatives considered:** Pin an older Radix-based shadcn style.
- **Consequences:** Component APIs follow Base UI. Visual layout still follows the HTML prototypes.

## D-008 — M0 follows the engineering milestone document

- **Date:** 2026-11-19
- **Status:** Accepted
- **Context:** `master-development-plan.md` describes a broader M0 that includes a live Supabase connection, three environments, three application layouts, and a shared component library. `docs/MILESTONES.md` assigns Supabase identity to M1 and shared UI to M2.
- **Decision:** Implementation milestones follow `docs/MILESTONES.md`. The master plan remains the product backlog.
- **Alternatives considered:** Expand M0 to match the master plan.
- **Consequences:** M0 establishes a local Next.js foundation only. Supabase, authentication, layouts, and product screens wait for their milestones. Several of the deferred items still depend on open questions.

## D-007 — Keep Next.js Cache Components off

- **Date:** 2026-11-19
- **Status:** Accepted
- **Context:** Next.js 16 can enable Cache Components during app creation. Crowne's accepted client data path is TanStack React Query and Route Handlers (D-002). `docs/ARCHITECTURE.md` already allows an approved server-rendered read path for public pages.
- **Decision:** The M0 application is created with Cache Components disabled. Do not enable them without a new decision.
- **Alternatives considered:** Accept the Next.js 16 create-next-app default.
- **Consequences:** Server caching for public reads is undecided. React Compiler and template agent files stay off. `next.config.ts` sets `agentRules: false` because `next dev` otherwise appends a managed block to `AGENTS.md`.

## D-001 — Use a modular monolith

- **Status:** Accepted
- **Decision:** Build one Next.js application with clear feature/domain boundaries and one Supabase backend.
- **Reason:** Keeps early delivery and operations simple while allowing disciplined modularity.
- **Consequence:** Do not split into microservices without evidence and an approved decision.

## D-002 — React Query and API Route Handlers; no Server Actions for app data

- **Status:** Accepted
- **Decision:** Use TanStack React Query for client-side data fetching and mutations. Use Next.js Route Handlers as the HTTP boundary. Do not use Server Actions for application data mutations.
- **Reason:** Explicit, consistent client/server contract and predictable caching/invalidation.
- **Consequence:** Build typed API conventions and query hooks; server-rendered public reads may use an approved server read path, but not Server Actions.

## D-003 — Supabase is the backend platform

- **Status:** Accepted
- **Decision:** Use Supabase PostgreSQL, Auth, Storage, and RLS.
- **Reason:** Matches the selected stack and provides integrated data/auth/storage capabilities.
- **Consequence:** Migrations and RLS policies are first-class source-controlled assets.

## D-004 — WorkAbroad is an optional channel

- **Status:** Accepted
- **Decision:** Crowne's own portal must operate independently. WorkAbroad may remain another recruitment channel.
- **Reason:** Crowne may continue using WorkAbroad initially but must not be locked into it.
- **Consequence:** Model publication channels and source attribution independently. Do not assume API/webhook capabilities.

## D-005 — Candidate and application are separate entities

- **Status:** Accepted
- **Decision:** One candidate profile can be associated with multiple applications; each application has its own status and history.
- **Reason:** A person may apply for multiple jobs without duplicating identity records.
- **Consequence:** UI, database, and reporting must preserve this distinction.

## D-006 — Crowne visual direction

- **Status:** Accepted as working direction; final brand approval pending
- **Decision:** Use royal blue and gold with clean neutral surfaces. Prototype values: royal `#141E68`, gold `#F4CF36`.
- **Reason:** Retains recognizable colors from the supplied Crowne logo while modernizing the interface.
- **Consequence:** Keep logo artwork provisional until Crowne supplies approved vector/high-resolution assets.

## Template for future decisions

### D-XXX — Title

- **Date:**
- **Status:** Proposed / Accepted / Superseded
- **Context:**
- **Decision:**
- **Alternatives considered:**
- **Consequences:**
