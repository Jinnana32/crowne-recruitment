# Security, Privacy, Authentication, and RLS

Security is a core requirement, not a final hardening task.

## 1. Authentication

- Use Supabase Auth.
- Support applicant and staff identities.
- Use the official SSR/session integration compatible with installed package versions.
- Protect applicant and agency routes server-side.
- Do not trust role values supplied by the browser.
- Implement sign-out and session-expiry behavior.
- Account recovery and email/phone verification policies require confirmation.

## 2. Authorization model

Use least privilege. The proposed staff roles are a starting point and must be confirmed with Crowne:

- Super Admin
- Admin
- Recruitment Staff
- Processing Staff
- Deployment Staff
- Finance Staff
- Accounting Staff
- Management
- Candidate

A role name alone may not be sufficient. Define permissions and record-level scope. Examples:
- Candidate can read/update only their own permitted profile fields and see only their own applications/documents.
- Recruitment staff can access recruitment records within their assigned scope.
- Processing staff can access required processing records but should not automatically receive unrestricted medical access.
- Medical data access must be specifically restricted.
- Finance staff can access finance records according to approved responsibilities.
- Management access/report visibility must be defined explicitly.

## 3. RLS requirements

- Enable RLS on every table exposed through Supabase client APIs.
- Write explicit SELECT, INSERT, UPDATE, and DELETE policies as needed.
- Default to deny; add only justified policies.
- Test both allowed and denied cases.
- Check ownership and relationship paths, not just user IDs passed from the client.
- Prevent applicants from reading another applicant's records by guessing UUIDs.
- Prevent unauthorized staff from changing job orders, selection decisions, processing status, deployment, or finance records.
- Never use UI visibility as the security boundary.

## 4. API Route Handler security

Every API route must:
1. Authenticate the request.
2. Validate request body, query parameters, and path identifiers.
3. Authorize the actor against the target resource.
4. Execute a narrowly scoped operation.
5. Return a safe, typed response.
6. Avoid returning secrets, internal notes, or restricted fields.
7. Use appropriate HTTP status codes and safe error messages.

Do not assume a route is protected because the page calling it is protected.

## 5. Service role

- Service-role key is server-only and must never be prefixed with `NEXT_PUBLIC_`.
- Do not use service role for normal user CRUD.
- If an exceptional privileged operation is approved, isolate it in a server-only module, document why RLS cannot safely perform it, validate the caller and target resource, and audit the action.
- Never return service-role-derived unrestricted data to the browser.

## 6. Sensitive data

Treat the following as sensitive:
- Passport and identity documents
- Medical information/results
- Personal contact details and addresses
- Contracts and employment documents
- Financial records and receipts
- Internal recruiter notes and employer feedback

Use private storage buckets and short-lived signed URLs where appropriate. Do not log document contents, tokens, passwords, or medical details.

## 7. Auditability

Audit important events such as:
- Role/permission changes
- Candidate/application status transitions
- Employer/job-order approvals and edits
- Document verification/rejection
- Medical access or status changes where appropriate
- Processing/deployment approvals
- Financial creation, approval, edits, and payment allocation
- Data export and privileged access

Define audit event scope and retention with Crowne. Do not create an audit system that stores unnecessary sensitive content.

## 8. Privacy and compliance

Design with the Philippine Data Privacy Act and applicable overseas recruitment rules in mind. This document is not a legal opinion. Crowne must confirm its privacy notices, lawful bases, retention periods, consent language, data-subject request process, and regulatory obligations with its designated privacy/legal advisers.

The platform must not claim to issue official government approvals or replace DMW processes.
