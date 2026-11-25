# API and React Query Conventions

## 1. Project decision

Client-side fetching and mutations use **TanStack React Query**. Do not use Next.js Server Actions for application data mutations or client data fetching.

Use Next.js Route Handlers (`src/app/api/**/route.ts`) as the HTTP boundary for client-initiated operations.

## 2. Route structure

Use resource-oriented routes, for example:

```text
GET    /api/jobs
GET    /api/jobs/:jobId
POST   /api/applications
GET    /api/applications
GET    /api/applications/:applicationId
PATCH  /api/candidates/me
GET    /api/candidates/me
POST   /api/candidates/me/documents
GET    /api/candidates/me/documents
```

Examples are conventions, not proof that the corresponding feature/schema exists. Implement only when the underlying domain contract is approved.

## 3. Route handler responsibilities

Keep route handlers thin:
- Parse request.
- Authenticate actor.
- Validate input (Zod).
- Authorize resource/action.
- Call domain/service function.
- Return consistent response.

Do not put complex business rules directly in route handlers.

## 4. Response envelope

Use a consistent response shape unless a documented streaming/file response requires otherwise:

```ts
type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

Never return raw database errors, stack traces, secrets, or restricted fields to clients. Keep detailed diagnostics in server logs with sensitive values redacted.

## 5. HTTP status conventions

- `200` successful read/update
- `201` resource created
- `204` successful operation with no response body
- `400` malformed request
- `401` unauthenticated
- `403` authenticated but not authorized
- `404` resource absent or intentionally concealed
- `409` conflict (duplicate, invalid state transition, stale version)
- `422` well-formed request failing domain validation
- `500` unexpected server failure

## 6. React Query conventions

- Centralize `QueryClient` setup and defaults.
- Use feature-specific query keys.
- Use query hooks for reads and mutation hooks for writes.
- Invalidate/update affected query keys after successful mutations.
- Avoid broad invalidation when a narrow key is known.
- Configure stale times deliberately; do not cache sensitive data longer than justified.
- Handle loading, error, empty, and success states in every screen.
- Avoid duplicate local state for server-owned records.
- Use optimistic updates only when rollback and concurrency behavior are defined.
- Do not put access tokens or sensitive personal data into query keys.

Example shape (adapt to installed versions and code conventions):

```ts
export const applicationKeys = {
  all: ["applications"] as const,
  list: (filters: ApplicationFilters) =>
    [...applicationKeys.all, "list", filters] as const,
  detail: (id: string) =>
    [...applicationKeys.all, "detail", id] as const,
};
```

## 7. Mutations and idempotency

- Validate status transitions server-side.
- Protect against accidental duplicate submissions where appropriate.
- For operations that may be retried, consider idempotency keys or unique constraints.
- Do not assume disabling a button prevents duplicate requests.
- Use database transactions/RPC only when the operation requires atomic multi-record changes and the design is approved.

## 8. File upload

- Use a dedicated upload flow with file type/size validation.
- Verify actor and ownership before issuing upload permission or signed URL.
- Use private buckets for non-public files.
- Persist metadata only after successful upload, with cleanup/recovery for orphaned objects.
- Never trust filename, MIME type, or client-provided ownership metadata.
