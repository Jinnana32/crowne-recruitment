# Product Rules — Approved Domain Behavior

This document captures the current product decisions. Items marked **Open** are not approved behavior and must not be hardcoded.

## 1. Product purpose

Provide Crowne with an integrated system for overseas recruitment operations, from job demand and advertising through candidate applications, selection, processing, deployment, and operational finance.

## 2. Product surfaces

### Public careers website
- Visitors can browse public job advertisements without signing in.
- Job listings should support search/filtering based on published fields.
- Job details must show only information approved for public display.
- Applying requires an applicant account.

### Applicant portal
- Applicants can create and manage their own account.
- Applicants maintain one canonical candidate profile.
- Applicants can submit multiple applications.
- Applicants can see their own applications and the applicant-visible status/updates.
- Applicants can update profile information and submit requested documents, subject to configured rules.
- Applicants must never see another applicant's profile, documents, application, or private notes.

### Agency workspace
- Authorized staff manage employers, job orders, candidates, applications, processing, deployment, finance, and reporting.
- Access is role- and permission-controlled.
- Sensitive data is only available to specifically authorized roles.

## 3. Core domain rules

1. One candidate represents one person and should not be duplicated for each application.
2. One candidate may have many applications.
3. Each application relates to a specific job order/position and has its own status and status history.
4. Candidate profile status is distinct from application status.
5. Processing status is distinct from recruitment/application status.
6. Deployment status is distinct from processing status.
7. Job order is the master record for an employer's manpower request.
8. Job advertisements/publications are separate from job orders. One job order may have multiple channel publications.
9. WorkAbroad is an optional channel, not the system of record.
10. Applications from Crowne's own portal, WorkAbroad, manual entry, and future approved sources should be attributable by source.
11. The platform should prevent over-recruitment by tracking vacancies and selected/confirmed candidates against approved job-order capacity. Exact counting rules require confirmation.
12. Requirements may differ by employer, country, job, and job order. Do not hardcode one universal checklist.
13. A selected candidate can enter a processing workflow; do not automatically treat every shortlisted applicant as selected.
14. Finance records must be linkable to relevant business records where appropriate.
15. Do not automatically charge expenses to candidates. Payer/responsibility rules must be validated against applicable law, contract, and agency policy.

## 4. Recruitment lifecycle — indicative baseline

The following is a proposed configurable baseline, not a fixed universal workflow:

- Application received
- Initial screening
- Shortlisted
- Interview scheduled
- Interview completed
- Employer review
- Employer selected
- Processing
- Rejected
- On hold
- Withdrawn

Do not assume every job uses every stage or that stages must be linear. Store status history and actor/timestamp for material transitions.

## 5. Processing and deployment

- Processing may include document collection/verification, medical steps, contract steps, orientation, and approvals.
- Exact required documents and workflow steps vary by country, employer, job, and job order.
- Medical information is sensitive and requires restricted access.
- Incomplete mandatory requirements should prevent a candidate from being marked ready for deployment.
- Deployment records may include clearance references, visa information, travel arrangements, departure, and post-deployment follow-up.
- The platform tracks agency workflow; it does not replace official DMW or other government systems, decisions, or approvals.

## 6. WorkAbroad

- Crowne may continue using WorkAbroad while also using its own public portal.
- The ORMS must function independently if Crowne later stops using WorkAbroad.
- Do not promise API sync, webhook sync, automatic publication, or automatic candidate import until verified with WorkAbroad and approved by Crowne.
- Initial integration may be manual/CSV import/export.
- Store source attribution and external reference identifiers when a verified integration/import requires them.
- Deduplication must be reviewed carefully; do not merge people automatically based only on similar names.

## 7. Finance scope

Initial agreed direction is operational finance while accounting is currently spreadsheet-based. Candidate areas include transactions, expenses, receipt attachments, invoices, payments, approvals, and links to employers/job orders/candidates.

**Open scope decision:** whether full accounting is required, including chart of accounts, journals, general ledger, AP/AR, bank reconciliation, trial balance, and financial statements. Do not claim the initial operational finance module is a complete accounting system.

## 8. Demo data

All names, employers, vacancies, salary ranges, dates, statistics, and transactions in the HTML prototypes are illustrative placeholders. Never migrate them as Crowne's real data or display them in production as factual records.
