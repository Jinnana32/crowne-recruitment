# Development Guidelines

## 1. General

- TypeScript strict mode should remain enabled.
- Prefer small, focused components and functions.
- Avoid `any`; if unavoidable, document why and narrow immediately.
- Do not suppress TypeScript or ESLint errors to make a build pass.
- Use clear domain names: `candidate`, `application`, `jobOrder`, `processingRecord`, `deploymentRecord`.
- Avoid vague names such as `item`, `data2`, or `status` where a domain-specific name is available.
- Keep components presentational where possible; put server state in React Query hooks and domain rules on the server.

## 2. Feature module pattern

A feature may use this structure as it grows:

```text
features/applications/
  components/
  hooks/
    use-applications.ts
    use-create-application.ts
  schemas/
    application.schema.ts
  services/
    application.service.ts
  types/
    application.types.ts
  utils/
```

Do not create empty boilerplate files. Use only the parts needed for the feature.

## 3. Forms and validation

- Use a consistent form library only after confirming the dependency choice (React Hook Form + Zod is the proposed default).
- Validate on the client for usability and on the server for security.
- Show field-level errors and preserve user input after recoverable failures.
- Do not trust client-side validation alone.
- Make required/optional fields explicit and accessible.

## 4. UI and accessibility

- Use shadcn/ui components and Tailwind tokens.
- Use semantic HTML and accessible labels.
- Ensure keyboard navigation and visible focus.
- Do not encode status by color alone; include text labels.
- Keep layouts responsive.
- Provide loading skeletons/spinners, empty states, errors, and confirmation for destructive actions.
- Use confirmation dialogs for irreversible or high-impact actions.
- Do not create fake interactivity. If a control is not implemented, label it as unavailable or leave it out.

## 5. Errors and observability

- Use typed domain/API errors.
- Show concise, user-safe messages.
- Log actionable diagnostics server-side with correlation/request identifiers where practical.
- Never log passwords, auth tokens, full document contents, or sensitive medical information.
- Do not silently swallow errors.

## 6. Code quality

Before completing a task, run available project scripts:
- lint
- typecheck (if defined)
- unit tests
- integration tests (if defined)
- production build

If a script is missing, report it. Do not claim checks passed if they were not run.

## 7. Change management

- Keep changes scoped to the assigned milestone.
- Update docs and migrations in the same change as behavior/schema changes.
- Avoid adding dependencies without justification.
- Do not rewrite generated files by hand.
- Do not change framework major versions as incidental cleanup.
