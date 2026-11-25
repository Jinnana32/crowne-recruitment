# Testing Strategy

## 1. Test layers

- Unit tests: domain functions, validators, transition rules, formatting.
- API tests: authentication, validation, authorization, response contract.
- Database/RLS tests: access allowed/denied for representative roles and ownership.
- Component tests: forms, loading/error/empty states, interaction behavior.
- End-to-end tests: critical applicant and staff journeys.

Use the test tools already present in the repository. `npm test` runs Node's built-in test runner. `tests/register-alias.mjs` resolves `@/` imports so tests can load application modules. If none exist, propose a minimal toolchain and get approval before adding dependencies.

## 2. Critical security cases

At minimum test:
- Unauthenticated user cannot access protected applicant/agency API routes.
- Applicant A cannot read/update Applicant B's profile.
- Applicant A cannot read Applicant B's applications or documents.
- Applicant cannot access staff-only routes or actions.
- Recruitment staff cannot access medical details unless explicitly authorized.
- Finance-only data is not returned to unauthorized roles.
- Guessing another record UUID does not bypass authorization.
- Service-role secrets never appear in client bundles.

## 3. Critical domain cases

- One candidate can have multiple applications.
- Each application has independent status and history.
- Invalid status transitions are rejected.
- A job cannot accept applications if not public/published/available under approved rules.
- Vacancy fulfillment follows approved capacity rules.
- A selected application cannot skip required processing gates.
- Incomplete mandatory processing items block deployment readiness.
- Duplicate submission behavior is deterministic.
- WorkAbroad imports preserve source attribution and do not silently merge candidate identities.

## 4. UI state coverage

Every data-driven screen should cover:
- Loading
- Empty
- Success
- API/network error
- Validation error
- Unauthorized/forbidden
- Not found
- Disabled/in-progress submit state

## 5. Release gate

Do not mark a milestone complete unless:
- Relevant automated tests pass.
- RLS/API authorization tests pass for affected data.
- Typecheck, lint, and production build pass.
- Manual smoke test is recorded for the primary journey.
- Known failures and untested paths are listed.
