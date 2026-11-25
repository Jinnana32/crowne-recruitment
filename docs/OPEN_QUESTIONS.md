# Open Questions — Do Not Guess

This file tracks information that must be confirmed with Crowne. Agents may propose options but must not silently choose business behavior.

## Business and workflow

- [ ] What are the exact staff roles and permissions?
- [ ] Does Crowne have branches/offices or more than one legal agency entity?
- [ ] Who creates job orders, who approves them, and what supporting documents are mandatory?
- [ ] What is the exact meaning of vacancy fulfillment: selected, contract-signed, visa-approved, or deployed?
- [ ] Can one job order contain multiple positions with different qualifications/salaries?
- [ ] What are the actual recruitment stages and allowed transitions?
- [ ] Who can reject, put on hold, withdraw, or re-open an application?
- [ ] What candidate duplicate-matching identifiers are approved?
- [ ] What applicant-visible status labels and notifications should be used?
- [ ] Which country/employer/job-specific processing checklists are currently used? (Demo uses a provisional Middle East checklist from D-016 until Crowne confirms.)
- [x] Which destinations should the careers site and job orders offer for this demo? Middle East only (D-017).
- [ ] Which medical details may be stored, and which roles may access them?
- [ ] What official clearance references need to be tracked, and what is only a link/reference to an external process?
- [ ] What is the post-deployment monitoring process?

## Public portal and applicants

- [ ] What exact agency address, contact details, social links, and approved public copy should appear?
- [ ] Which job fields can be shown publicly?
- [ ] Should salary/benefits be displayed, and who approves those values?
- [ ] Is email verification required before applying?
- [ ] Can applicants save jobs or withdraw applications?
- [ ] What are the privacy notice, terms, consent, and data retention requirements?
- [ ] What file types and maximum sizes are accepted for applicant documents? (Provisional in D-014: PDF/JPG/PNG up to 10 MB until Crowne confirms.)
- [ ] Which documents can applicants upload directly versus staff-only upload? (Provisional in D-014: applicants upload their own files; staff create requests and review.)

## WorkAbroad and other channels

- [ ] Does WorkAbroad provide API/webhook/export access for Crowne's account?
- [ ] What data can legally/contractually be imported/exported?
- [ ] Is a CSV template available?
- [ ] How should duplicate applicants and external IDs be reconciled?
- [ ] Which other channels are planned (Facebook, other job boards, walk-ins, referrals)?

## Finance and accounting

- [ ] Is the scope operational finance only, or full accounting?
- [ ] Which transaction categories and approval levels are used?
- [ ] Are invoices issued to foreign employers? What are the invoice/payment workflows?
- [ ] What currencies, exchange-rate rules, and reporting currency are required?
- [ ] Which financial records are linked to candidates/job orders/employers?
- [ ] What are the rules for who pays each processing-related expense?

## Technical and operations

- [ ] Which Supabase project/environment will be used?
- [ ] What domains/subdomains are preferred for public, applicant, and agency surfaces?
- [ ] Which email provider and sender identity are approved?
- [ ] What backup, retention, recovery, and hosting requirements apply?
- [ ] What production support/monitoring expectations exist?

## Rule

When a task depends on an unanswered item:
1. Identify the exact question.
2. Explain why it affects implementation.
3. Offer a safe temporary option only if it can be clearly isolated/configured.
4. Do not present a temporary assumption as approved business behavior.
