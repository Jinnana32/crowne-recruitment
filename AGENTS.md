# AGENTS.md — Crowne ORMS Engineering Guardrails

## Mission

Build Crowne ORMS: a secure, maintainable overseas recruitment management platform for 2018 Crowne Human Resources, Inc. It consists of:

1. Public careers website and job marketplace
2. Applicant account and self-service portal
3. Internal agency operations application
4. Shared data and workflow services backed by Supabase

The system must support Crowne's current WorkAbroad usage as an optional recruitment channel while allowing Crowne to operate its own independent public job portal. Do not make WorkAbroad a platform dependency.

## Non-negotiable rules

1. **Read the project docs before coding.** Read `README.md`, `docs/ARCHITECTURE.md`, `docs/PRODUCT_RULES.md`, `docs/DATABASE.md`, `docs/SECURITY_AND_RLS.md`, and `docs/DEVELOPMENT_GUIDELINES.md`.
2. **Do not invent requirements, schema, APIs, workflows, permissions, or integrations.** If a requirement is missing or ambiguous, record it in `docs/OPEN_QUESTIONS.md` and ask for clarification before implementing behavior that depends on it.
3. **Do not silently change an approved decision.** Update `docs/DECISIONS.md` with the rationale before making an architectural change.
4. **No Next.js Server Actions for application data mutations.** All client-side fetching and mutations must use TanStack React Query and explicit API route handlers. This is a project decision.
5. **Use Supabase for authentication, PostgreSQL, storage, and Row Level Security.** RLS is mandatory. Never rely on hiding UI controls as authorization.
6. **Database migrations are the source of truth.** Never make undocumented manual schema changes in the Supabase dashboard. Every schema change must be represented by a migration committed to source control.
7. **Never expose Supabase service-role credentials to the browser.** Do not use service role keys in client components, public environment variables, or client bundles.
8. **Do not bypass RLS for convenience.** Any privileged server-side operation must be explicit, justified, narrowly scoped, and documented.
9. **Do not duplicate candidate identities.** A candidate has one canonical profile and can have multiple applications. Each application has its own recruitment status and history.
10. **Keep domain concepts separate.** Candidate status, application status, processing status, and deployment status are different concepts.
11. **Do not hardcode country- or employer-specific recruitment requirements into generic UI logic.** Requirements must be data/configuration-driven once the relevant configuration model is approved.
12. **Do not invent WorkAbroad API capabilities.** Treat integration as conditional on verified vendor documentation, credentials, permissions, and client approval. CSV/manual import is an acceptable initial path if required.
13. **Do not imply the system performs official DMW approvals or replaces official government systems.**
14. **Treat medical and identity documents as sensitive.** Use private storage, least-privilege access, signed URLs with short expiry where appropriate, and audit important access/actions.
15. **Use the approved Crowne visual direction.** Royal blue and gold identity, clean white/light neutral surfaces, accessible contrast, restrained gold accents. Refer to `docs/UI_DESIGN_SYSTEM.md`.
16. **Do not use fake data in production paths.** Demo fixtures must be clearly isolated from real application data and must never be mistaken for live records.
17. **Do not claim a feature is complete because a screen renders.** Include loading, empty, error, permission-denied, validation, and success states, plus tests for critical behavior.
18. **Avoid broad refactors unrelated to the assigned task.** Keep changes focused and explain any necessary cross-cutting changes.

## Required workflow for every task

1. Identify the milestone and feature being worked on.
2. Read the relevant documentation and existing implementation.
3. Inspect current code, migrations, generated Supabase types, and tests before proposing changes.
4. State assumptions and unresolved questions. Do not convert assumptions into facts.
5. Propose the smallest coherent implementation plan.
6. Implement in small, reviewable steps.
7. Add or update migrations, types, validation, API route handlers, React Query hooks, UI states, and tests as applicable.
8. Run lint, typecheck, tests, and build (or state exactly which could not be run and why).
9. Summarize changed files, behavior, verification, known limitations, and follow-up work.
10. Update docs when behavior, schema, architecture, or decisions change.

## Architecture constraints

- Next.js App Router with TypeScript.
- Tailwind CSS and shadcn/ui for presentation.
- TanStack React Query for client-side server-state fetching, caching, invalidation, and mutations.
- Supabase PostgreSQL, Auth, and Storage.
- API Route Handlers (`app/api/**/route.ts`) are the HTTP boundary for client-initiated reads/writes where appropriate.
- Keep domain logic in reusable server-side modules, not embedded in route handlers or UI components.
- Use feature-oriented modules and shared domain types.
- Prefer a modular monolith. Do not introduce microservices without an approved decision.
- Use Zod (or the project's explicitly approved validation library) at trust boundaries.

## Before adding a dependency

- Check whether the repository already has an equivalent dependency.
- Explain why the dependency is needed.
- Prefer stable, maintained packages compatible with the installed Next.js and React versions.
- Do not upgrade major framework versions as part of an unrelated feature.

## Definition of done

A task is done only when:
- Requirements and acceptance criteria are met.
- Authorization is enforced server-side and by RLS where applicable.
- Input is validated at the server boundary.
- UI handles loading, empty, error, success, and unauthorized states.
- Critical paths have automated tests.
- No secrets or sensitive data are exposed.
- Typecheck, lint, tests, and production build pass, or failures are clearly documented.
- Relevant docs and migrations are updated.
