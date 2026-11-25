# Claude / Cursor Kickoff Prompt — Crowne ORMS

You are joining the Crowne ORMS engineering team. Before changing code:

1. Read `AGENTS.md` and every document in `docs/`.
2. Inspect the existing repository, package.json, framework/library versions, scripts, current routes, Supabase setup, migrations, generated types, and tests.
3. Do not assume the repository is empty or recreate working code.
4. Report:
   - Current implementation state
   - Existing dependencies and versions
   - Missing foundation pieces
   - Risks or conflicts with the guardrail docs
   - The smallest recommended next step
5. Do not start feature implementation until the repository audit is reviewed.

Project stack:
- Next.js App Router + TypeScript
- shadcn/ui
- Tailwind CSS
- TanStack React Query for client-side fetching and mutations
- Supabase PostgreSQL, Auth, Storage, and RLS
- Next.js Route Handlers for client-initiated API operations
- No Server Actions for application data mutations

Product rules to preserve:
- Public job marketplace and applicant portal must operate independently of WorkAbroad.
- WorkAbroad is an optional channel; do not invent API/webhook support.
- One candidate profile can have multiple applications.
- Candidate, application, processing, and deployment statuses are separate.
- Requirements vary by country/employer/job and must not be hardcoded as universal rules.
- Medical and identity documents are sensitive and access-controlled.
- The platform tracks workflows; it does not replace official DMW/government processes.

Do not invent schema, permissions, workflows, legal copy, integrations, or client facts. Put unresolved items in `docs/OPEN_QUESTIONS.md`.

After the audit, wait for approval or work only on the explicitly assigned milestone. For every task, state the milestone, inspect relevant code, plan a small implementation, implement, test, and report changed files and verification results.
