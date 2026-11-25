# Architecture

## 1. Architectural style

Use a **modular monolith**: one Next.js application, one Supabase project, clear domain boundaries, and independently understandable feature modules. Do not introduce microservices, message brokers, or separate deployables without an approved decision.

## 2. Application surfaces

Recommended route groups (adjust only after inspecting the existing repository):

```text
src/app/
  (public)/
    page.tsx
    jobs/
    about/
  (applicant)/
    applicant/
      dashboard/
      applications/
      profile/
      documents/
  (agency)/
    agency/
      dashboard/
      employers/
      job-orders/
      recruitment/
      candidates/
      processing/
      deployment/
      finance/
      reports/
      settings/
  api/
    ... route handlers ...
```

Route groups organize layouts; they do not provide security. Every protected page and API endpoint must independently enforce authentication and authorization.

## 3. Suggested source organization

```text
src/
  app/
    (public)/
    (applicant)/
    (agency)/
    api/
  components/
    ui/                 # shadcn/ui components
    shared/
  features/
    auth/
    employers/
    job-orders/
    job-publications/
    candidates/
    applications/
    recruitment/
    processing/
    deployment/
    finance/
    reporting/
  lib/
    supabase/
      browser.ts
      server.ts
      middleware.ts     # or the version-appropriate session helper
    query/
    auth/
    validation/
    errors/
  hooks/
  types/
  config/
supabase/
  migrations/
  seed.sql              # development/demo data only; never real production personal data
```

Do not create all modules as empty scaffolding in advance. Add feature folders when implementation begins.

## 4. Data flow

For client-driven application features:

```text
Client Component
  -> TanStack Query hook
  -> fetch() to /api/... Route Handler
  -> authenticate request using Supabase session
  -> validate input with Zod
  -> authorize user and resource access
  -> domain/service function
  -> Supabase database operation (RLS still applies)
  -> typed response
  -> React Query cache update/invalidation
```

For public read-only pages, use a documented public API route or server-rendered read path consistent with the task. If the data is fetched in a Server Component, do not use Server Actions. The React Query requirement primarily governs client-side fetching and mutations.

Do not let browser components import privileged server modules or use service-role credentials.

## 5. Supabase client boundaries

Maintain distinct clients:
- Browser client: safe public URL and anon/publishable key; respects RLS.
- Server request client: cookie/session-aware; uses the authenticated user's context and respects RLS.
- Admin/service-role client: server-only, exceptional, narrowly scoped, never imported by client modules.

Use the official `@supabase/ssr` approach appropriate to the installed Supabase/Next.js versions. Verify current package APIs rather than copying stale snippets.

## 6. Domain boundaries

Keep these concepts separate:
- Employer
- Job order / manpower request
- Job position or vacancy definition
- Job advertisement / publication channel
- Candidate (canonical person/profile)
- Application (candidate's application to one position/job order)
- Recruitment event/history
- Processing record
- Deployment record
- Financial transaction / invoice / payment

A job order can be published through multiple channels. A candidate can have multiple applications. Application records are not candidate records.

## 7. UI composition

- Use shared layouts for public, applicant, and agency surfaces.
- Use shadcn/ui for buttons, inputs, dialogs, dropdowns, tables, tabs, forms, and accessible primitives.
- Keep domain feature components in their feature folders.
- Keep reusable visual primitives in `components/shared`.
- Avoid giant page components; compose pages from focused components and hooks.
- Keep server-only and client-only code boundaries explicit.

## 8. Background work

Do not simulate reliable background processing with in-memory timers or client-side polling. PDF generation, bulk imports, reminders, and scheduled expiry checks may require a durable background mechanism. Select and document the mechanism when that milestone is scoped. Do not add a queue provider prematurely.

## 9. Architecture changes

Any change to the data flow, auth model, tenancy/agency model, API strategy, or deployment topology must be added to `docs/DECISIONS.md` with date, context, decision, and consequences.
