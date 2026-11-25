import type { DocumentMime, DocumentSensitivity, DocumentStatus, RequestState } from "@/lib/domain/documents";
import type { ApplicationStage } from "@/lib/domain/stages";

export type Employer = {
  id: string;
  name: string;
  country: string;
  status: "Active" | "On hold";
  contactName: string;
};

export type JobOrder = {
  id: string;
  reference: string;
  title: string;
  employerId: string;
  country: string;
  vacancies: number;
  status: "Recruiting" | "On hold" | "Completed";
  channels: Array<"Website" | "WorkAbroad">;
};

export type JobPublication = {
  id: string;
  jobOrderId: string;
  title: string;
  category: string;
  employmentType: string;
  salaryLabel: string;
  description: string;
  qualifications: string[];
  responsibilities: string[];
  published: boolean;
};

export type Candidate = {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  status: "Active" | "For processing";
  source: "Agency portal" | "WorkAbroad" | "Walk-in" | "Referral";
  mobile: string;
  dateOfBirth: string;
  nationality: string;
  preferredRole: string;
  experience: string;
  education: string;
  languages: string;
  preferredDestination: string;
};

export type Application = {
  id: string;
  reference: string;
  candidateId: string;
  jobOrderId: string;
  publicationId: string | null;
  stage: ApplicationStage;
  source: Candidate["source"];
  appliedOn: string;
  recruiter: string;
};

export type ChecklistItem = {
  label: string;
  state: "Done" | "Pending" | "Passed";
};

export type ProcessingRecord = {
  id: string;
  reference: string;
  applicationId: string;
  checklist: ChecklistItem[];
  nextAction: string;
  status: "In progress" | "Ready";
};

export type DeploymentRecord = {
  id: string;
  reference: string;
  applicationId: string;
  departureDate: string;
  travelStatus: "Ticket confirmed" | "Booking pending" | "Not booked";
  readiness: "Ready" | "Clearance review";
};

export type FinanceTransaction = {
  id: string;
  reference: string;
  description: string;
  relatedRecord: string;
  recordedOn: string;
  amountDecimal: string;
  currency: "PHP";
  status: "Posted" | "Approved" | "For review";
  kind: "income" | "expense";
};

/** hasFile is false for older name-only records. */
export type CandidateDocument = {
  id: string;
  candidateId: string;
  name: string;
  requestId: string | null;
  originalFilename: string | null;
  mimeType: DocumentMime | null;
  sizeBytes: number | null;
  hasFile: boolean;
  uploadedAt: string;
  status: DocumentStatus;
  sensitivity: DocumentSensitivity;
};

/** state comes from the newest document submitted against the request. */
export type DocumentRequest = {
  id: string;
  candidateId: string;
  name: string;
  description: string;
  sensitivity: DocumentSensitivity;
  requestedAt: string;
  state: RequestState;
  documentId: string | null;
};

export type DocumentsView = {
  requests: DocumentRequest[];
  documents: CandidateDocument[];
};

/** Months are "YYYY-MM". endMonth is "" when isCurrent is true. */
export type WorkExperienceEntry = {
  id: string;
  candidateId: string;
  jobTitle: string;
  employerName: string;
  country: string;
  startMonth: string;
  endMonth: string;
  isCurrent: boolean;
  description: string;
};

export type EducationEntry = {
  id: string;
  candidateId: string;
  qualification: string;
  school: string;
  fieldOfStudy: string;
  startMonth: string;
  endMonth: string;
  isCurrent: boolean;
};

export type DemoCatalog = {
  illustrative: true;
  workExperience: WorkExperienceEntry[];
  education: EducationEntry[];
  employers: Employer[];
  jobOrders: JobOrder[];
  publications: JobPublication[];
  candidates: Candidate[];
  applications: Application[];
  processing: ProcessingRecord[];
  deployments: DeploymentRecord[];
  transactions: FinanceTransaction[];
  documents: CandidateDocument[];
  documentRequests: Omit<DocumentRequest, "state" | "documentId">[];
};
