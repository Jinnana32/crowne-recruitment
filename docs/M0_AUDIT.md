# M0 Repository Audit

**Audit date:** 19 November 2026  
**Foundation implemented:** 19 November 2026, after approval of the change set in this document.  
**Milestone contract:** `docs/MILESTONES.md` M0. Accepted as D-008. No commit has been made.

## Verdict

The repository was a planning package. The approved M0 foundation is now in place: a Next.js App Router application starts locally, and lint, typecheck, and build pass. Supabase, authentication, layouts, React Query, shadcn/ui, and product features are still absent on purpose.

## What the audit found

Inspected on this machine before scaffolding: Node.js `v22.16.0`, npm `10.9.2`. The workspace was not a git repository. Present files were guardrail docs, `master-development-plan.md`, and two HTML prototypes. There was no `package.json`, application source, environment example, test runner, or migration.

No secrets or `.env` files were in the tree. Decisions D-001 through D-006 already matched the approved stack. `docs/OPEN_QUESTIONS.md` still holds unapproved business behavior. Prototype salaries and people are illustrative and must not be seeded.

Two conflicts were resolved by the approval:

- M0 follows `docs/MILESTONES.md`. The master plan's Supabase connection, three environments, three layouts, and shared component library stay in later milestones (D-008).
- Next.js Cache Components stay off (D-007). `create-next-app` was also run with `--no-agents-md` and `--no-agent-feedback`.

`README.md` cited prototype filenames that were not on disk. Those paths now match `design-reference/admin-prototype.html` and `design-reference/applicant-prototype.html`.

## What was implemented

Generated with `create-next-app@16.4.6` in a temporary directory, using the empty Tailwind App Router template, TypeScript, ESLint, `src/`, and npm. Application files were copied into this repo. Crowne `AGENTS.md`, `README.md`, `docs/`, and `design-reference/` were kept.

| Package | Installed version |
|---|---|
| `next` / `eslint-config-next` | 16.4.6 |
| `react` / `react-dom` | 19.3.0 |
| `typescript` | 5.9.3 (`strict: true`) |
| `tailwindcss` / `@tailwindcss/turbopack` | 4.3.3 |
| `eslint` | 9.39.5 |

The official template selected these versions. npm's newer TypeScript 7 and ESLint 10 were not forced in over the template.

Also added:

- `src/app` foundation page. It states that the local foundation is running. It does not show prototype jobs, people, or salaries.
- Root body background and text color, so the page stays readable on a dark browser canvas.
- `.env.example` with empty `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`. No `.env.local`.
- `.gitignore` from the template, plus `!.env.example`, so the example can be committed and real env files cannot.
- `typecheck` script: `next typegen && tsc --noEmit`. Next.js 16 route types are generated, which is what the template `LayoutProps` type needs.
- Git repository on branch `main`. Nothing is committed.
- D-007 and D-008 in `docs/DECISIONS.md`.

`next.config.ts` sets `agentRules: false`. The first `next dev` appended a managed Next.js block to `AGENTS.md`. Disabling `agentRules` removed that block on the next dev start and left the Crowne guardrails intact.

Not installed, by the approved boundary: `@tanstack/react-query`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, shadcn/ui, React Hook Form, and a test runner.

## Verification

Recorded 19 November 2026 after the final source changes.

| Check | Result |
|---|---|
| `npm run lint` | Passed. ESLint reported no errors. |
| `npm run typecheck` | Passed. `next typegen` succeeded, then `tsc --noEmit`. |
| `npm run build` | Passed. Next.js 16.4.6 Turbopack. Static routes `/` and `/_not-found`. |
| Dev server | `http://localhost:3000` returned the foundation page. Browser title `Crowne ORMS`. Heading "Project foundation". Tailwind layout applied (`max-w-2xl`, white background, dark text). |
| Tests | No test script and no test runner. `docs/TESTING.md` requires approval before adding one. |
| Secrets | No `.env.local`. `.env.example` has empty values. `git check-ignore` ignores `.env.local`, `node_modules`, `.next`, and `.DS_Store`, and does not ignore `.env.example`. |

The dev server was stopped after the browser check. Start it again with `npm run dev`.

## M0 exit criteria

| Criterion | Status |
|---|---|
| Existing repository state documented | Met by this file |
| App starts locally | Met |
| No secrets committed | Met. No secrets are present, ignore rules exist, and there is no commit yet |
| Guardrail docs available to agents | Met. `AGENTS.md` remains the Crowne document |
| Lint, typecheck, and build status recorded | Met. All three passed. Tests are not configured |

## Still out of scope

- Supabase project, CLI, clients, migrations, generated database types, auth, and RLS (M1)
- shadcn/ui, Crowne theme tokens, three layouts, and the React Query provider (M2)
- Business features, seed data, and WorkAbroad behavior
- A test dependency, until the first behavior worth testing is approved
- The first git commit, which waits for a separate request

## Known limitations

- `npm ci` prints that `eslint@9.39.5` is deprecated. ESLint 10 is supported by `eslint-config-next@16.4.6`, but upgrading it was not part of this scaffold.
- Cache Components, React Compiler, and Next.js agent feedback remain off until a new decision.
- Which Supabase project to use is still an open question, so `.env.local` was not created.
- `master-development-plan.md` still describes a broader M0. D-008 says implementation follows `docs/MILESTONES.md`.
