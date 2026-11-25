# Overseas Recruitment Management System
## Master Product Development Plan

**Product type:** Integrated Overseas Recruitment Management System  
**Primary market:** Philippine land-based overseas recruitment agencies  
**Product approach:** Modular, configurable, agency-owned platform  
**External recruitment channel:** WorkAbroad (optional)  
**Architecture:** Centralized database with interconnected business modules

---

# M0 — Project Foundation

### Objective
Establish the development environment, architecture, conventions, and technical foundation.

### Scope

**Project setup**
- Initialize Next.js with TypeScript.
- Configure Tailwind CSS and shadcn/ui.
- Configure Supabase.
- Establish development, staging, and production environments.
- Configure environment variables.
- Establish Git workflow and branch conventions.

**Application architecture**
- Public website layout.
- Candidate portal layout.
- Internal administration layout.
- Shared component library.
- Feature-based folder organization.
- Server/client component conventions.
- Centralized error handling.

**Documentation**
- `README.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `DEVELOPMENT_GUIDELINES.md`
- `MILESTONES.md`

### Acceptance criteria
- Application runs locally.
- Supabase connection works.
- Three application environments/layouts are established.
- Shared UI components are available.
- Development conventions are documented.
- No business-specific features are implemented prematurely.

---

# M1 — Database & Identity Management

### Objective
Build the foundation for all business records, user accounts, authentication, and authorization.

### Database entities

**Identity**
- profiles
- roles
- permissions
- departments
- user_roles
- audit_logs

**Reference data**
- countries
- currencies
- document_types
- employment_categories
- system_settings

### Features

**Authentication**
- Staff login.
- Candidate registration and login.
- Password recovery.
- Session management.
- Protected routes.

**Role-based access control**

Initial roles:
- Super Administrator
- Administrator
- Recruitment Staff
- Processing Staff
- Deployment Staff
- Finance Staff
- Accounting Staff
- Management
- Candidate

**Permission management**
- Module-level access.
- Record-level access.
- Read/create/update/delete permissions.
- Approval permissions.
- Restricted document access.

**Audit logging**
- Record creation.
- Record updates.
- Status changes.
- Approval decisions.
- Financial modifications.
- User activity.

### Acceptance criteria
- Staff and candidates can authenticate.
- Users are assigned appropriate roles.
- Unauthorized users cannot access restricted modules.
- Important actions generate audit records.
- Database access is protected by Supabase RLS policies.

---

# M2 — Core Business Management

### Objective
Establish the agency's operational foundation before building the recruitment workflows.

### Module A: Employer Management

Entities:
- employers
- employer_contacts
- employer_addresses
- employer_accreditations
- employer_agreements

Features:
- Create and manage foreign employers.
- Employer profiles.
- Contact persons.
- Destination countries.
- Accreditation information.
- Agreement and contract attachments.
- Employer status.
- Employer activity history.

### Module B: Job Order Management

Entities:
- job_orders
- job_positions
- job_requirements
- job_order_documents
- job_order_approvals

Features:
- Create job orders.
- Link orders to employers.
- Define destination countries.
- Define positions and qualifications.
- Set requested vacancies.
- Configure salary and benefits.
- Set employment terms.
- Track job order validity.
- Record approvals.
- Monitor remaining vacancies.
- Track selected and deployed workers.

### Module C: Recruitment Configuration

Entities:
- recruitment_workflows
- workflow_stages
- requirement_templates
- requirement_template_items
- assessment_types

Features:
- Country configuration.
- Job-specific requirements.
- Configurable recruitment stages.
- Medical requirement templates.
- Document requirement templates.
- Assessment configuration.
- Template versioning.

### Acceptance criteria
- Multiple employers can be registered.
- Employers can have multiple job orders.
- Job orders can have multiple positions.
- Vacancy counts are tracked.
- Requirements can be configured without code changes.
- Only appropriately authorized job orders can proceed to publication.

---

# M3 — Public Job Portal

### Objective
Build the agency's independently operating recruitment website and job marketplace.

### Public website

**Main pages**
- Homepage.
- About the agency.
- Job listings.
- Job details.
- Contact page.
- Privacy policy.
- Terms and conditions.

### Job marketplace

Features:
- Display published jobs.
- Search by position.
- Filter by destination country.
- Filter by industry/category.
- View salary and benefits.
- View qualifications.
- View employment details.
- Show available application opportunities.
- SEO-friendly job pages.

### Job publishing

Entities:
- job_advertisements
- publication_channels
- job_publications

Features:
- Publish job orders to the agency website.
- Draft, published, expired and archived states.
- Manage publication dates.
- Link advertisements to job orders.
- Track publication sources.
- Prepare for external publishing integrations.

### Candidate application

Features:
- Candidate registration.
- Online application.
- Personal information form.
- Education information.
- Employment history.
- Skills and qualifications.
- Supporting document uploads.
- Application confirmation.
- Application reference number.

### Application sources

The application must distinguish:
- Agency website.
- WorkAbroad.
- Manual registration.
- Other future recruitment channels.

### Acceptance criteria
- Administrators can publish and unpublish jobs.
- Public visitors can browse jobs without logging in.
- Candidates can register and apply.
- Applications are linked to the correct job order.
- Application source is recorded.
- Only published and eligible job advertisements are publicly accessible.

---

# M4 — Candidate Management

### Objective
Create a centralized candidate database and standardized CV generation system.

### Database entities
- candidates
- candidate_profiles
- candidate_addresses
- candidate_experience
- candidate_education
- candidate_skills
- candidate_certifications
- candidate_documents
- candidate_references
- candidate_emergency_contacts
- candidate_identifiers

### Candidate profile

Information sections:
1. Personal information.
2. Contact details.
3. Address.
4. Education.
5. Employment history.
6. Skills and competencies.
7. Licenses and certifications.
8. Languages.
9. Supporting documents.
10. Application history.

### Candidate management features

- Candidate directory.
- Advanced search.
- Filters by skills, experience, education and country.
- Candidate profile viewing.
- Candidate editing.
- Candidate document management.
- Duplicate detection.
- Candidate source tracking.
- Candidate application history.
- Candidate status and availability.

### CV generation

Features:
- Standardized agency CV template.
- Generate CV from structured candidate data.
- Download PDF.
- Preview CV.
- Update and regenerate CV.
- Maintain CV versions.
- Allow authorized staff to verify candidate information.

### Candidate portal integration

Candidates should be able to:
- Update their profile.
- Upload documents.
- View their generated CV.
- Download their CV.
- Review application history.

### Acceptance criteria
- Candidate information is stored in structured database fields.
- One candidate can have multiple applications.
- Duplicate detection identifies possible matching profiles.
- Recruiters can filter candidates using structured information.
- CVs can be generated as downloadable PDFs.

---

# M5 — Recruitment Pipeline

### Objective
Manage the entire recruitment process from initial screening through employer selection.

### Database entities
- applications
- application_status_history
- recruitment_workflows
- workflow_stages
- application_stage_history
- interviews
- interview_participants
- interview_evaluations
- candidate_assessments
- selection_decisions
- recruitment_notes

### Recruitment pipeline

Default stages:
1. Application Received.
2. Initial Screening.
3. Shortlisted.
4. Interview Scheduled.
5. Interview Completed.
6. Employer Review.
7. Employer Selected.
8. Processing.
9. Rejected.
10. On Hold.
11. Withdrawn.

Stages should be configurable.

### Features

**Applicant management**
- View incoming applicants.
- Assign recruiter.
- Review CV.
- Review qualifications.
- Compare candidates.
- Add internal notes.

**Screening**
- Qualification checks.
- Experience evaluation.
- Skills assessment.
- Screening decisions.

**Interview management**
- Schedule interviews.
- Assign interviewers.
- Record interview results.
- Record evaluation scores.
- Attach interview documents.

**Employer selection**
- Submit shortlisted candidates.
- Record employer feedback.
- Record acceptance or rejection.
- Track selected candidates.
- Monitor job order vacancy fulfillment.

**Recruitment history**
- Record every status change.
- Record responsible staff.
- Preserve decision history.

### Acceptance criteria
- Recruiters can move candidates between permitted stages.
- Interview records are associated with applications.
- Employer decisions are recorded.
- Rejected and withdrawn applications remain accessible.
- Every recruitment decision has a history.
- Recruitment status is separate from overall candidate status.

---

# M6 — Processing & Onboarding

### Objective
Manage selected candidates through medical examinations, document collection, employment contracts and onboarding.

### Database entities
- worker_processing_records
- processing_checklists
- processing_checklist_items
- medical_records
- medical_results
- document_submissions
- employment_contracts
- onboarding_records
- approval_requests
- approval_history

### Processing features

**Processing dashboard**
- Selected candidates awaiting processing.
- Candidates with incomplete requirements.
- Candidates awaiting medical results.
- Candidates awaiting approvals.
- Candidates ready for deployment preparation.

**Medical management**
- Medical examination scheduling.
- Medical provider information.
- Examination dates.
- Medical status.
- Fit/unfit/pending outcomes.
- Re-examination tracking.
- Restricted medical record access.

**Document management**
- Configurable document requirements.
- Upload documents.
- Review submitted documents.
- Approve or reject documents.
- Request corrections.
- Track expiration dates.
- Document completion percentage.

**Contract management**
- Contract preparation.
- Contract attachments.
- Contract status.
- Contract signing tracking.
- Contract version history.

**Onboarding**
- Orientation checklist.
- Required briefings.
- Acknowledgments.
- Final documentation.
- Processing completion.

**Approval workflow**
- Staff submissions.
- Supervisor review.
- Approval/rejection.
- Return for correction.
- Approval history.

### Acceptance criteria
- Selected candidates can enter processing.
- Requirements can differ per job order.
- Staff can review and approve documents.
- Medical information has restricted access.
- Processing progress is visible.
- Incomplete requirements prevent the candidate from being marked ready for deployment.

---

# M7 — Deployment Management

### Objective
Manage candidates who have completed recruitment and processing and are preparing for overseas deployment.

### Database entities
- deployment_records
- deployment_requirements
- visa_records
- travel_records
- departure_records
- deployed_workers
- worker_contracts
- post_deployment_records

### Features

**Deployment preparation**
- Deployment eligibility.
- Final clearance checklist.
- Visa processing tracking.
- Applicable DMW documentation.
- OEC/OFW clearance tracking.
- Travel document management.

**Travel management**
- Flight information.
- Departure date.
- Destination.
- Travel details.
- Departure confirmation.

**Deployment tracking**
- Pending deployment.
- Ready for deployment.
- Scheduled for departure.
- Deployed.
- Delayed.
- Cancelled.

**Worker records**
- Deployment history.
- Employer assignment.
- Employment contract.
- Deployment date.
- Contract duration.
- Post-deployment status.

**Post-deployment monitoring**
- Worker status.
- Contract monitoring.
- Relevant incidents.
- Welfare follow-ups.
- Return and repatriation records where applicable.

### Acceptance criteria
- Only eligible candidates can be marked ready for deployment.
- Deployment records reference the selected application and job order.
- Departure information is recorded.
- Deployed workers remain accessible through historical records.
- Deployment statistics are available.

---

# M8 — Finance & Accounting

### Objective
Centralize financial operations and associate transactions with the relevant recruitment activities.

### Database entities
- financial_transactions
- transaction_categories
- expense_records
- expense_receipts
- payees
- invoices
- invoice_items
- payments
- payment_allocations
- financial_approvals
- financial_accounts

### A. Financial transaction management

Features:
- Record income.
- Record expenses.
- Categorize transactions.
- Associate transactions with candidates.
- Associate transactions with job orders.
- Associate transactions with employers.
- Upload receipts.
- Attach supporting documents.
- Track transaction status.

### B. Expense management

Features:
- Staff expense submissions.
- Receipt uploads.
- Expense categories.
- Approval workflows.
- Expense verification.
- Expense history.
- Expense reporting.

### C. Employer invoicing

Features:
- Create invoices.
- Assign employer.
- Add invoice line items.
- Reference job orders.
- Invoice numbering.
- Invoice PDF generation.
- Invoice due dates.
- Payment tracking.
- Outstanding balance monitoring.

### D. Payment management

Features:
- Record payments.
- Partial payments.
- Multiple payments per invoice.
- Payment references.
- Payment dates.
- Payment allocation.
- Outstanding balance calculation.

### E. Accounting foundation

Prepare the data model for future:
- Chart of accounts.
- General ledger.
- Journal entries.
- Accounts receivable.
- Accounts payable.
- Bank reconciliation.
- Trial balance.
- Financial statements.

Full accounting should be a separately validated scope, not assumed to be covered by operational transaction recording.

### Financial controls

- Role-based financial access.
- Approval hierarchy.
- Immutable transaction history.
- Audit logs.
- Controlled corrections and reversals.
- Payer and expense responsibility classification.

### Acceptance criteria
- Staff can record transactions.
- Receipts are stored securely.
- Expenses can be submitted and approved.
- Invoices can be generated.
- Payments can be allocated to invoices.
- Outstanding balances are calculated correctly.
- Financial data can be filtered by employer, candidate and job order.

---

# M9 — Management Dashboard & Reporting

### Objective
Provide management with a centralized overview of recruitment operations and financial performance.

### Dashboard areas

**A. Recruitment overview**
- Total applicants.
- Applications received.
- Shortlisted candidates.
- Interviews conducted.
- Employer-selected candidates.
- Rejected applications.

**B. Job order overview**
- Active job orders.
- Vacancies.
- Candidates selected.
- Remaining vacancies.
- Fulfillment percentage.

**C. Processing overview**
- Candidates in processing.
- Incomplete documents.
- Pending medical examinations.
- Pending approvals.
- Candidates ready for deployment.

**D. Deployment overview**
- Pending deployment.
- Scheduled departures.
- Deployed workers.
- Deployment by employer.
- Deployment by destination country.

**E. Financial overview**
- Total recorded income.
- Total recorded expenses.
- Outstanding invoices.
- Payments received.
- Unpaid balances.
- Expense breakdown.

### Reporting features

- Filter by date range.
- Filter by employer.
- Filter by destination country.
- Filter by job order.
- Export reports to PDF.
- Export tables to Excel/CSV.
- Printable reports.

### Acceptance criteria
- Dashboard metrics come from actual database records.
- Metrics can be filtered.
- Financial totals reconcile with transaction records.
- Recruitment and deployment reports are accurate.
- Management can export reports.

---

# M10 — Integrations & Automation

### Objective
Connect the system with external recruitment channels and automate repetitive operational tasks.

### A. WorkAbroad integration

The platform must support WorkAbroad as an optional recruitment channel.

Potential capabilities:
- Record WorkAbroad job references.
- Import applicant information.
- Import CVs and supporting documents where permitted.
- Record application sources.
- Identify duplicate candidates.
- Map external job references to internal job orders.
- Track import history and errors.

Automatic API synchronization and publishing are conditional on WorkAbroad's actual integration capabilities and permissions.

### B. Import/export framework

- CSV imports.
- Excel imports.
- Candidate bulk imports.
- Candidate exports.
- Job order exports.
- Data migration tools.

### C. Notifications

- Application confirmation.
- Interview invitations.
- Document requests.
- Processing updates.
- Approval notifications.
- Deployment reminders.
- Invoice reminders.

### D. Background tasks

- PDF generation.
- Email delivery.
- Document expiration checks.
- Scheduled reminders.
- Import processing.
- Report generation.

### Acceptance criteria
- External sources can be recorded.
- Imported records preserve source references.
- Duplicate detection works.
- Failed imports can be reviewed.
- External integrations can be disabled without affecting core operations.

---

# M11 — System-wide QA & Release

### Objective
Prepare the application for reliable client use.

### Functional testing
- Candidate registration.
- Job application.
- CV generation.
- Candidate management.
- Recruitment status transitions.
- Employer selection.
- Processing and onboarding.
- Deployment.
- Financial transactions.
- Invoice and payment calculations.
- Dashboard accuracy.

### Security testing
- Role-based permissions.
- Supabase RLS.
- Candidate record isolation.
- Private document access.
- Medical record restrictions.
- Financial record restrictions.
- Input validation.
- Authentication and session handling.

### Performance testing
- Candidate search.
- Large candidate lists.
- Database query efficiency.
- File upload performance.
- PDF generation.
- Dashboard aggregation.

### Data integrity
- Duplicate prevention.
- Referential integrity.
- Vacancy count accuracy.
- Application history preservation.
- Financial calculation accuracy.
- Audit history preservation.

### Release preparation
- Production environment.
- Database migrations.
- Backup strategy.
- Error monitoring.
- Logging.
- User documentation.
- Admin documentation.
- Deployment instructions.

### Acceptance criteria
- Complete end-to-end recruitment scenario passes.
- No critical authorization or data isolation issues.
- Core workflows work on desktop and mobile.
- Financial calculations are verified.
- Production deployment and recovery procedures are documented.

---

# Cross-module product requirements

These requirements apply to all milestones.

1. All modules must use the same centralized business records.
2. All important business operations must be auditable.
3. Permissions must be enforced on the server and database, not just the UI.
4. All workflows must preserve historical records.
5. Status changes must be validated through business rules.
6. Country, employer and job requirements must be configurable.
7. Documents must be stored securely.
8. Financial records must not be silently deleted or overwritten.
9. External recruitment integrations must remain optional.
10. The platform must support multiple employers, job orders and recruitment channels.

# Suggested end-to-end acceptance scenario

A complete implementation must support this scenario:

1. Administrator creates a foreign employer.
2. Administrator creates an approved job order.
3. Recruiter creates and publishes a job advertisement.
4. Candidate visits the public website.
5. Candidate registers and submits an application.
6. System creates an application record.
7. Candidate information becomes available in the candidate database.
8. System generates a standardized CV.
9. Recruiter screens and shortlists the candidate.
10. Recruiter schedules an interview.
11. Employer selection is recorded.
12. Candidate enters processing.
13. Staff collect and approve required documents.
14. Medical examination is recorded.
15. Contract and onboarding are completed.
16. Candidate becomes eligible for deployment.
17. Deployment and departure information are recorded.
18. Finance records associated transactions and receipts.
19. Employer invoice is generated and payment is tracked.
20. Management views the complete recruitment and financial history.

**Definition of Done:** The same candidate, job order and employer records must remain connected throughout the entire scenario. No department should need to re-encode information already captured by another department.

---

# Development execution rules

For AI-assisted development:

- Each milestone must be broken into smaller implementation tasks.
- Every task must identify the affected database tables, business logic, UI and tests.
- Database migrations must be committed and version-controlled.
- Agents must read the architecture and development guidelines before modifying the codebase.
- Avoid parallel agents modifying the same schema or shared components without coordination.
- Every milestone must have an explicit acceptance checklist.
- Do not mark a milestone complete based solely on UI implementation.
- Test actual database persistence and permissions.
- Update documentation after architecture or schema changes.

**Recommended implementation order:** M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M9 → M10 → M11.

Some UI and backend work can be parallelized once the underlying interfaces and data contracts are established.

---

# Final Product Outcome

The completed system should allow an overseas recruitment agency to operate its business through one centralized platform:

- Advertise overseas employment opportunities.
- Accept and manage applicants.
- Generate and maintain candidate CVs.
- Manage recruitment and employer selection.
- Process candidates and manage onboarding.
- Track worker deployment.
- Manage expenses and financial transactions.
- Generate invoices and monitor collections.
- Monitor business performance.

The system must remain fully functional without WorkAbroad, while retaining the option to use WorkAbroad as an additional recruitment channel.

**Product principle: One agency. One platform. One connected recruitment lifecycle.**
