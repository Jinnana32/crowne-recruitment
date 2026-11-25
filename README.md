# Crowne ORMS

Crowne ORMS is a web-based overseas recruitment operations platform for 2018 Crowne Human Resources, Inc.

## Product surfaces

- **Public careers website:** public job listings, job details, agency information, and applicant registration.
- **Applicant portal:** applicant profile, applications, status updates, and requested document submission.
- **Agency workspace:** employer and job-order management, recruitment, processing, deployment, finance, reporting, and administration.

These experiences share one backend and canonical candidate records, but have different navigation, access rules, and user experiences.

## Technology stack

| Area | Technology | Project rule |
|---|---|---|
| Framework | Next.js App Router + TypeScript | Use the installed stable version; do not upgrade casually |
| UI | shadcn/ui | Use accessible primitives and consistent variants |
| Styling | Tailwind CSS | Follow `docs/UI_DESIGN_SYSTEM.md` |
| Server state | TanStack React Query | Use for client-side queries and mutations |
| Backend | Supabase | PostgreSQL, Auth, Storage, RLS |
| HTTP boundary | Next.js Route Handlers | Client mutations go through explicit API endpoints |
| Validation | Zod | Validate all untrusted input at server boundaries |

**Important:** Do not use Next.js Server Actions for application data fetching or mutations. Use React Query on the client and API Route Handlers on the server.

## Start here

1. Read `AGENTS.md`.
2. Read all documents in `docs/`.
3. Inspect the current repository and report its actual state before scaffolding or replacing files.
4. Confirm environment variables using `.env.example`. Never commit `.env.local`.
5. Apply database migrations using the documented Supabase workflow.
6. Run the project checks before marking a milestone complete.

## Required documentation

- `AGENTS.md` — coding-agent rules and task workflow.
- `docs/ARCHITECTURE.md` — application architecture and boundaries.
- `docs/PRODUCT_RULES.md` — approved domain rules.
- `docs/DATABASE.md` — schema principles and migration policy.
- `docs/SECURITY_AND_RLS.md` — authorization, privacy, storage, and RLS.
- `docs/API_CONVENTIONS.md` — API route and React Query conventions.
- `docs/DEVELOPMENT_GUIDELINES.md` — code organization and implementation practices.
- `docs/UI_DESIGN_SYSTEM.md` — Crowne visual system and UX rules.
- `docs/MILESTONES.md` — implementation sequence and exit criteria.
- `docs/TESTING.md` — test strategy and definition of done.
- `docs/DECISIONS.md` — architecture/product decision log.
- `docs/OPEN_QUESTIONS.md` — unresolved client and product questions.

## Design references

The HTML prototypes are visual references, not production implementations or authoritative sources for business rules:

- Admin prototype: `design-reference/admin-prototype.html`
- Applicant prototype: `design-reference/applicant-prototype.html`

The approved prototype files are in `design-reference/`. Do not assume demo content, sample salary values, example names, statuses, or metrics are real Crowne data.

## Environment variables

Create `.env.local` from `.env.example`. The exact values must come from the Supabase project configuration.

Expected variable names (confirm package/version conventions before implementation):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Use the publishable key instead if the project uses Supabase's newer key format.
# Keep secret/service-role credentials server-only and only add them if a justified server task requires them.
SUPABASE_SERVICE_ROLE_KEY=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Prefer the anon/publishable key with RLS for normal application access.

## Current project status

M0 through the first product screens are in the app. Public jobs, applicant account pages, and the agency workspace render from an illustrative local dataset until a Supabase project is configured. The audit is in `docs/M0_AUDIT.md`.

Do not treat the illustrative records as live Crowne data. WorkAbroad has no API connection. The platform does not issue government approvals.
