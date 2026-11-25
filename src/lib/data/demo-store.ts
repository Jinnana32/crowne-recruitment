import {
  checklistCompletionPercent,
  DEFAULT_PROCESSING_CHECKLIST,
  DEMO_MEDICAL_EXPENSE,
  DEMO_PLACEMENT_INCOME,
  isChecklistComplete,
  MEDICAL_CHECKLIST_LABEL,
  nextActionFromChecklist,
} from "@/lib/domain/processing";
import { FULFILLMENT_NOTE, fulfillmentPercent, PIPELINE_COLUMNS } from "@/lib/domain/stages";
import { centsFromDecimal, decimalFromCents } from "@/lib/domain/money";
import { createSeedCatalog } from "@/lib/data/seed";
import type {
  Application,
  Candidate,
  CandidateDocument,
  ChecklistItem,
  DemoCatalog,
  DeploymentRecord,
  DocumentRequest,
  DocumentsView,
  EducationEntry,
  Employer,
  JobOrder,
  ProcessingRecord,
  WorkExperienceEntry,
} from "@/lib/data/types";
import type { DeleteResult, DocumentActor, DocumentUpload, OpenResult, UploadResult } from "@/lib/data/document-store";
import { displayNameFromFilename, downloadFilename, requestState, type DocumentStatus } from "@/lib/domain/documents";
import type { ApplicationStage } from "@/lib/domain/stages";
import { profileCompleteness } from "@/lib/domain/profile";
import type { DocumentRequestInput, EducationInput, WorkExperienceInput } from "@/lib/validation/api";

export type PublicJob = {
  id: string;
  title: string;
  employer: string;
  country: string;
  category: string;
  vacancies: number;
  employmentType: string;
  salaryLabel: string;
  jobOrderReference: string;
  description: string;
};

export type PublicJobDetail = PublicJob & {
  description: string;
  qualifications: string[];
  responsibilities: string[];
};

export type JobOrderView = {
  id: string;
  reference: string;
  title: string;
  employer: string;
  country: string;
  vacancies: number;
  applicants: number;
  selected: number;
  fulfillmentPercent: number;
  channels: JobOrder["channels"];
  status: JobOrder["status"];
  publicationId: string | null;
  category: string;
  employmentType: string;
  salaryLabel: string;
  description: string;
  published: boolean;
};

export type JobOrderEdit = {
  title: string;
  country: string;
  vacancies: number;
  category: string;
  employmentType: string;
  salaryLabel: string;
  description: string;
  published: boolean;
};

export type EmployerView = Employer & { jobOrders: number };

export type ApplicationView = {
  id: string;
  reference: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  country: string;
  employer: string;
  stage: ApplicationStage;
  source: Application["source"];
  appliedOn: string;
  recruiter: string;
};

export type CandidateView = Candidate & {
  latestApplication: string;
  applicationCount: number;
  profileCompleteness: number;
  workExperienceCount: number;
  educationCount: number;
};

export type ProcessingView = {
  id: string;
  reference: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  country: string;
  checklist: DemoCatalog["processing"][number]["checklist"];
  completionPercent: number;
  nextAction: string;
  status: "In progress" | "Ready";
  hasDeployment: boolean;
};

export type DeploymentView = {
  id: string;
  reference: string;
  applicationId: string;
  candidateName: string;
  employer: string;
  jobTitle: string;
  country: string;
  departureDate: string;
  travelStatus: DemoCatalog["deployments"][number]["travelStatus"];
  readiness: DemoCatalog["deployments"][number]["readiness"];
};

export type DashboardView = {
  illustrative: boolean;
  fulfillmentNote: string;
  applicants: number;
  applications: number;
  shortlisted: number;
  selected: number;
  jobOrders: number;
  vacancies: number;
  processing: number;
  readyForDeployment: number;
  deployments: number;
  incomeCents: number;
  expenseCents: number;
  pendingApprovals: number;
  stageCounts: Array<{ stage: string; count: number }>;
  priorityJobOrders: JobOrderView[];
};

const globalStore = globalThis as typeof globalThis & {
  __crowneDemoCatalog?: DemoCatalog;
};

export function demoCatalog() {
  if (!globalStore.__crowneDemoCatalog) {
    globalStore.__crowneDemoCatalog = createSeedCatalog();
  }
  return globalStore.__crowneDemoCatalog;
}

function employerName(catalog: DemoCatalog, employerId: string) {
  return catalog.employers.find((employer) => employer.id === employerId)?.name ?? "Employer";
}

function orderById(catalog: DemoCatalog, jobOrderId: string) {
  const order = catalog.jobOrders.find((item) => item.id === jobOrderId);
  if (!order) return null;
  return order;
}

export function listEmployers(): EmployerView[] {
  const catalog = demoCatalog();
  return catalog.employers.map((employer) => ({
    ...employer,
    jobOrders: catalog.jobOrders.filter((order) => order.employerId === employer.id).length,
  }));
}

function publicationFor(catalog: DemoCatalog, jobOrderId: string) {
  const matches = catalog.publications.filter((item) => item.jobOrderId === jobOrderId);
  return matches.find((item) => item.published) ?? matches[0] ?? null;
}

export function listJobOrders(): JobOrderView[] {
  const catalog = demoCatalog();
  return catalog.jobOrders.map((order) => {
    const related = catalog.applications.filter((application) => application.jobOrderId === order.id);
    const selected = related.filter((application) => application.stage === "Selected").length;
    const publication = publicationFor(catalog, order.id);
    return {
      id: order.id,
      reference: order.reference,
      title: order.title,
      employer: employerName(catalog, order.employerId),
      country: order.country,
      vacancies: order.vacancies,
      applicants: related.length,
      selected,
      fulfillmentPercent: fulfillmentPercent(selected, order.vacancies),
      channels: order.channels,
      status: order.status,
      publicationId: publication?.id ?? null,
      category: publication?.category ?? "",
      employmentType: publication?.employmentType ?? "",
      salaryLabel: publication?.salaryLabel ?? "",
      description: publication?.description ?? "",
      published: publication?.published ?? false,
    };
  });
}

export function updateJobOrder(id: string, input: JobOrderEdit): JobOrderView | null {
  const catalog = demoCatalog();
  const order = catalog.jobOrders.find((item) => item.id === id);
  if (!order) return null;
  order.title = input.title;
  order.country = input.country;
  order.vacancies = input.vacancies;
  for (const publication of catalog.publications.filter((item) => item.jobOrderId === id)) {
    publication.title = input.title;
    publication.category = input.category;
    publication.employmentType = input.employmentType;
    publication.salaryLabel = input.salaryLabel;
    publication.description = input.description;
    publication.published = input.published;
  }
  return listJobOrders().find((item) => item.id === id) ?? null;
}

function toPublicJob(catalog: DemoCatalog, publicationId: string): PublicJobDetail | null {
  const publication = catalog.publications.find((item) => item.id === publicationId);
  const order = publication ? orderById(catalog, publication.jobOrderId) : null;
  if (!publication || !order) return null;
  return {
    id: publication.id,
    title: publication.title,
    employer: employerName(catalog, order.employerId),
    country: order.country,
    category: publication.category,
    vacancies: order.vacancies,
    employmentType: publication.employmentType,
    salaryLabel: publication.salaryLabel,
    jobOrderReference: order.reference,
    description: publication.description,
    qualifications: publication.qualifications,
    responsibilities: publication.responsibilities,
  };
}

export function listPublicJobs(filters: { query?: string; country?: string; category?: string }) {
  const catalog = demoCatalog();
  const query = filters.query?.trim().toLowerCase() ?? "";
  return catalog.publications
    .filter((publication) => publication.published)
    .map((publication) => toPublicJob(catalog, publication.id))
    .filter((job): job is PublicJobDetail => job !== null)
    .filter((job) => {
      const haystack = `${job.title} ${job.employer} ${job.country} ${job.category}`.toLowerCase();
      const matchesQuery = query.length === 0 || haystack.includes(query);
      const matchesCountry = !filters.country || job.country === filters.country;
      const matchesCategory = !filters.category || job.category === filters.category;
      return matchesQuery && matchesCountry && matchesCategory;
    })
    .map((job) => ({
      id: job.id,
      title: job.title,
      employer: job.employer,
      country: job.country,
      category: job.category,
      vacancies: job.vacancies,
      employmentType: job.employmentType,
      salaryLabel: job.salaryLabel,
      jobOrderReference: job.jobOrderReference,
      description: job.description,
    }));
}

export function getPublicJob(id: string) {
  const catalog = demoCatalog();
  const publication = catalog.publications.find((item) => item.id === id && item.published);
  if (!publication) return null;
  return toPublicJob(catalog, publication.id);
}

export function listApplications(): ApplicationView[] {
  const catalog = demoCatalog();
  return catalog.applications.map((application) => {
    const candidate = catalog.candidates.find((item) => item.id === application.candidateId);
    const order = orderById(catalog, application.jobOrderId);
    return {
      id: application.id,
      reference: application.reference,
      candidateId: application.candidateId,
      candidateName: candidate?.fullName ?? "Candidate",
      jobTitle: order?.title ?? "Job",
      country: order?.country ?? "",
      employer: order ? employerName(catalog, order.employerId) : "",
      stage: application.stage,
      source: application.source,
      appliedOn: application.appliedOn,
      recruiter: application.recruiter,
    };
  });
}

export function listCandidates(): CandidateView[] {
  const catalog = demoCatalog();
  const applications = listApplications();
  return catalog.candidates.map((candidate) => {
    const own = applications.filter((application) => application.candidateId === candidate.id);
    const latest = [...own].sort((left, right) => right.appliedOn.localeCompare(left.appliedOn))[0];
    const counts = {
      workExperienceCount: catalog.workExperience.filter((entry) => entry.candidateId === candidate.id).length,
      educationCount: catalog.education.filter((entry) => entry.candidateId === candidate.id).length,
    };
    return {
      ...candidate,
      latestApplication: latest ? `${latest.jobTitle} · ${latest.country}` : "None",
      applicationCount: own.length,
      profileCompleteness: profileCompleteness(candidate, counts),
      ...counts,
    };
  });
}

function newestFirst<T extends { startMonth: string; isCurrent: boolean }>(entries: T[]) {
  return [...entries].sort((left, right) => Number(right.isCurrent) - Number(left.isCurrent) || right.startMonth.localeCompare(left.startMonth));
}

export function listWorkExperience(candidateId: string) {
  return newestFirst(demoCatalog().workExperience.filter((entry) => entry.candidateId === candidateId));
}

export function saveWorkExperience(candidateId: string, input: WorkExperienceInput, entryId?: string): WorkExperienceEntry | null {
  const entries = demoCatalog().workExperience;
  const values = { ...input, endMonth: input.isCurrent ? "" : (input.endMonth ?? "") };
  if (entryId) {
    const entry = entries.find((item) => item.id === entryId && item.candidateId === candidateId);
    if (!entry) return null;
    Object.assign(entry, values);
    return entry;
  }
  const entry: WorkExperienceEntry = { id: `work-${Date.now()}-${entries.length}`, candidateId, ...values };
  entries.push(entry);
  return entry;
}

export function deleteWorkExperience(candidateId: string, entryId: string) {
  const catalog = demoCatalog();
  const before = catalog.workExperience.length;
  catalog.workExperience = catalog.workExperience.filter((item) => !(item.id === entryId && item.candidateId === candidateId));
  return catalog.workExperience.length < before;
}

export function listEducation(candidateId: string) {
  return newestFirst(demoCatalog().education.filter((entry) => entry.candidateId === candidateId));
}

export function saveEducation(candidateId: string, input: EducationInput, entryId?: string): EducationEntry | null {
  const entries = demoCatalog().education;
  const values = { ...input, endMonth: input.isCurrent ? "" : (input.endMonth ?? "") };
  if (entryId) {
    const entry = entries.find((item) => item.id === entryId && item.candidateId === candidateId);
    if (!entry) return null;
    Object.assign(entry, values);
    return entry;
  }
  const entry: EducationEntry = { id: `edu-${Date.now()}-${entries.length}`, candidateId, ...values };
  entries.push(entry);
  return entry;
}

export function deleteEducation(candidateId: string, entryId: string) {
  const catalog = demoCatalog();
  const before = catalog.education.length;
  catalog.education = catalog.education.filter((item) => !(item.id === entryId && item.candidateId === candidateId));
  return catalog.education.length < before;
}

function ensureProcessingForSelected() {
  const catalog = demoCatalog();
  for (const application of catalog.applications) {
    if (application.stage !== "Selected") continue;
    if (catalog.processing.some((record) => record.applicationId === application.id)) continue;
    catalog.processing.push({
      id: `prc-${crypto.randomUUID().slice(0, 8)}`,
      reference: `PRC-2026-${1800 + catalog.processing.length}`,
      applicationId: application.id,
      nextAction: nextActionFromChecklist(DEFAULT_PROCESSING_CHECKLIST),
      status: "In progress",
      checklist: DEFAULT_PROCESSING_CHECKLIST.map(({ label, state }) => ({ label, state })),
    });
    const candidate = catalog.candidates.find((item) => item.id === application.candidateId);
    if (candidate) candidate.status = "For processing";
  }
}

export function listProcessing(): ProcessingView[] {
  ensureProcessingForSelected();
  const catalog = demoCatalog();
  return catalog.processing.flatMap((record) => {
    const application = catalog.applications.find((item) => item.id === record.applicationId);
    if (!application || application.stage !== "Selected") return [];
    const candidate = catalog.candidates.find((item) => item.id === application.candidateId);
    const order = orderById(catalog, application.jobOrderId);
    return [{
      id: record.id,
      reference: record.reference,
      applicationId: application.id,
      candidateName: candidate?.fullName ?? "Candidate",
      jobTitle: order?.title ?? "Job",
      country: order?.country ?? "",
      checklist: record.checklist,
      completionPercent: checklistCompletionPercent(record.checklist),
      nextAction: record.nextAction,
      status: record.status,
      hasDeployment: catalog.deployments.some((item) => item.applicationId === application.id),
    }];
  });
}

export function updateChecklistItem(processingId: string, label: string, state: ChecklistItem["state"]) {
  const catalog = demoCatalog();
  const record = catalog.processing.find((item) => item.id === processingId);
  if (!record) return { ok: false as const, reason: "not_found" as const };
  if (record.status === "Ready") return { ok: false as const, reason: "already_ready" as const };
  const item = record.checklist.find((entry) => entry.label === label);
  if (!item) return { ok: false as const, reason: "item_not_found" as const };
  if (label === MEDICAL_CHECKLIST_LABEL && state !== "Pending" && state !== "Passed") {
    return { ok: false as const, reason: "invalid_state" as const };
  }
  if (label !== MEDICAL_CHECKLIST_LABEL && state !== "Pending" && state !== "Done") {
    return { ok: false as const, reason: "invalid_state" as const };
  }
  item.state = state;
  record.nextAction = nextActionFromChecklist(record.checklist);
  if (label === MEDICAL_CHECKLIST_LABEL && state === "Passed") {
    ensureMedicalExpense(catalog, record);
  }
  return { ok: true as const, record: listProcessing().find((item) => item.id === processingId)! };
}

export function markProcessingReady(processingId: string) {
  const catalog = demoCatalog();
  const record = catalog.processing.find((item) => item.id === processingId);
  if (!record) return { ok: false as const, reason: "not_found" as const };
  if (!isChecklistComplete(record.checklist)) return { ok: false as const, reason: "incomplete" as const };
  record.status = "Ready";
  record.nextAction = "Schedule departure";
  return { ok: true as const, record: listProcessing().find((item) => item.id === processingId)! };
}

function ensureMedicalExpense(catalog: DemoCatalog, record: ProcessingRecord) {
  const application = catalog.applications.find((item) => item.id === record.applicationId);
  const candidate = application ? catalog.candidates.find((item) => item.id === application.candidateId) : null;
  const related = `${candidate?.fullName ?? "Candidate"} · ${record.reference}`;
  if (catalog.transactions.some((item) => item.kind === "expense" && item.relatedRecord === related && item.description === MEDICAL_CHECKLIST_LABEL)) {
    return;
  }
  catalog.transactions.unshift({
    id: `trx-${crypto.randomUUID().slice(0, 8)}`,
    reference: `TRX-2026-${900 + catalog.transactions.length}`,
    description: MEDICAL_CHECKLIST_LABEL,
    relatedRecord: related,
    recordedOn: new Date().toISOString().slice(0, 10),
    amountDecimal: DEMO_MEDICAL_EXPENSE,
    currency: "PHP",
    status: "Approved",
    kind: "expense",
  });
}

export function createDeploymentFromProcessing(processingId: string, departureDate: string) {
  const catalog = demoCatalog();
  const record = catalog.processing.find((item) => item.id === processingId);
  if (!record) return { ok: false as const, reason: "not_found" as const };
  if (record.status !== "Ready") return { ok: false as const, reason: "not_ready" as const };
  if (catalog.deployments.some((item) => item.applicationId === record.applicationId)) {
    return { ok: false as const, reason: "exists" as const };
  }
  const application = catalog.applications.find((item) => item.id === record.applicationId);
  if (!application) return { ok: false as const, reason: "not_found" as const };
  const order = orderById(catalog, application.jobOrderId);
  const candidate = catalog.candidates.find((item) => item.id === application.candidateId);
  const deployment: DeploymentRecord = {
    id: `dep-${crypto.randomUUID().slice(0, 8)}`,
    reference: `DEP-2026-${100 + catalog.deployments.length}`,
    applicationId: record.applicationId,
    departureDate,
    travelStatus: "Booking pending",
    readiness: "Ready",
  };
  catalog.deployments.unshift(deployment);
  record.nextAction = "Departure scheduled";
  const related = `${employerName(catalog, order?.employerId ?? "")} · ${order?.title ?? "Job"} · ${candidate?.fullName ?? "Worker"}`;
  if (!catalog.transactions.some((item) => item.kind === "income" && item.relatedRecord === related)) {
    catalog.transactions.unshift({
      id: `trx-${crypto.randomUUID().slice(0, 8)}`,
      reference: `TRX-2026-${950 + catalog.transactions.length}`,
      description: "Employer placement fee",
      relatedRecord: related,
      recordedOn: new Date().toISOString().slice(0, 10),
      amountDecimal: DEMO_PLACEMENT_INCOME,
      currency: "PHP",
      status: "Posted",
      kind: "income",
    });
  }
  return { ok: true as const, deployment: listDeployments().find((item) => item.id === deployment.id)! };
}

export function updateDeployment(
  deploymentId: string,
  patch: { travelStatus?: DeploymentRecord["travelStatus"]; readiness?: DeploymentRecord["readiness"] },
) {
  const catalog = demoCatalog();
  const record = catalog.deployments.find((item) => item.id === deploymentId);
  if (!record) return null;
  if (patch.travelStatus) record.travelStatus = patch.travelStatus;
  if (patch.readiness) record.readiness = patch.readiness;
  return listDeployments().find((item) => item.id === deploymentId) ?? null;
}

export function listDeployments(): DeploymentView[] {
  const catalog = demoCatalog();
  return catalog.deployments.flatMap((record) => {
    const application = catalog.applications.find((item) => item.id === record.applicationId);
    if (!application) return [];
    const candidate = catalog.candidates.find((item) => item.id === application.candidateId);
    const order = orderById(catalog, application.jobOrderId);
    if (!order) return [];
    return [{
      id: record.id,
      reference: record.reference,
      applicationId: application.id,
      candidateName: candidate?.fullName ?? "Candidate",
      employer: employerName(catalog, order.employerId),
      jobTitle: order.title,
      country: order.country,
      departureDate: record.departureDate,
      travelStatus: record.travelStatus,
      readiness: record.readiness,
    }];
  });
}

export function listTransactions() {
  return demoCatalog().transactions;
}

const demoFiles = new Map<string, Uint8Array>();

export function listDocuments(candidateId: string): DocumentsView {
  const documents = demoCatalog()
    .documents.filter((document) => document.candidateId === candidateId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const requests = demoCatalog()
    .documentRequests.filter((request) => request.candidateId === candidateId)
    .map((request) => ({ ...request, ...requestState(request.id, documents) }));
  return { documents, requests };
}

export function uploadDocument(input: DocumentUpload): UploadResult {
  const catalog = demoCatalog();
  const request = input.requestId
    ? catalog.documentRequests.find((item) => item.id === input.requestId && item.candidateId === input.candidateId)
    : null;
  if (input.requestId && !request) return { ok: false, reason: "request_not_found" };
  const document: CandidateDocument = {
    id: `doc-${crypto.randomUUID().slice(0, 8)}`,
    candidateId: input.candidateId,
    name: input.name || request?.name || displayNameFromFilename(input.originalFilename),
    requestId: request?.id ?? null,
    originalFilename: input.originalFilename,
    mimeType: input.mime,
    sizeBytes: input.bytes.byteLength,
    hasFile: true,
    uploadedAt: new Date().toISOString(),
    status: "For review",
    sensitivity: request?.sensitivity ?? "standard",
  };
  catalog.documents.push(document);
  demoFiles.set(document.id, input.bytes);
  return { ok: true, document };
}

export function deleteDocument(candidateId: string, documentId: string): DeleteResult {
  const catalog = demoCatalog();
  const index = catalog.documents.findIndex((item) => item.id === documentId && item.candidateId === candidateId);
  if (index < 0) return "not_found";
  const document = catalog.documents[index];
  if (document.sensitivity !== "standard" || document.status !== "For review") return "locked";
  catalog.documents.splice(index, 1);
  demoFiles.delete(documentId);
  return "deleted";
}

export function openDocument(documentId: string, actor: DocumentActor): OpenResult {
  const document = demoCatalog().documents.find((item) => item.id === documentId);
  if (!document || (actor.role === "applicant" && document.candidateId !== actor.candidateId)) return { kind: "not_found" };
  if (document.sensitivity === "medical" && actor.role === "applicant") return { kind: "restricted" };
  const bytes = demoFiles.get(documentId);
  if (!bytes || !document.mimeType) return { kind: "no_file" };
  return { kind: "file", bytes, mime: document.mimeType, filename: downloadFilename(document.name, document.mimeType) };
}

export function reviewDocument(documentId: string, status: DocumentStatus) {
  const document = demoCatalog().documents.find((item) => item.id === documentId);
  if (!document) return null;
  document.status = status;
  return document;
}

export function createDocumentRequest(candidateId: string, input: DocumentRequestInput): DocumentRequest | null {
  const catalog = demoCatalog();
  if (!catalog.candidates.some((candidate) => candidate.id === candidateId)) return null;
  const request = {
    id: `req-${crypto.randomUUID().slice(0, 8)}`,
    candidateId,
    name: input.name,
    description: input.description,
    sensitivity: input.sensitivity,
    requestedAt: new Date().toISOString(),
  };
  catalog.documentRequests.push(request);
  return { ...request, state: "Required", documentId: null };
}

export function deleteDocumentRequest(candidateId: string, requestId: string) {
  const catalog = demoCatalog();
  const index = catalog.documentRequests.findIndex((item) => item.id === requestId && item.candidateId === candidateId);
  if (index < 0) return false;
  catalog.documentRequests.splice(index, 1);
  for (const document of catalog.documents) if (document.requestId === requestId) document.requestId = null;
  return true;
}

export function getDashboard(): DashboardView {
  const orders = listJobOrders();
  const applications = listApplications();
  const transactions = listTransactions();
  const incomeCents = transactions
    .filter((transaction) => transaction.kind === "income")
    .reduce((sum, transaction) => sum + centsFromDecimal(transaction.amountDecimal), 0);
  const expenseCents = transactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + centsFromDecimal(transaction.amountDecimal), 0);
  return {
    illustrative: true,
    fulfillmentNote: FULFILLMENT_NOTE,
    applicants: demoCatalog().candidates.length,
    applications: applications.length,
    shortlisted: applications.filter((application) => application.stage === "Shortlisted").length,
    selected: applications.filter((application) => application.stage === "Selected").length,
    jobOrders: orders.length,
    vacancies: orders.reduce((sum, order) => sum + order.vacancies, 0),
    processing: listProcessing().length,
    readyForDeployment: listProcessing().filter((record) => record.status === "Ready").length,
    deployments: listDeployments().length,
    incomeCents,
    expenseCents,
    pendingApprovals: transactions.filter((transaction) => transaction.status === "For review").length,
    stageCounts: PIPELINE_COLUMNS.map((stage) => ({
      stage,
      count: applications.filter((application) => application.stage === stage).length,
    })),
    priorityJobOrders: orders.slice(0, 4),
  };
}

export function createApplication(input: { candidateId: string; publicationId: string }) {
  const catalog = demoCatalog();
  const publication = catalog.publications.find((item) => item.id === input.publicationId && item.published);
  const candidate = catalog.candidates.find((item) => item.id === input.candidateId);
  if (!publication || !candidate) return { ok: false as const, reason: "That job is not open for applications." };
  const duplicate = catalog.applications.find(
    (application) => application.candidateId === candidate.id && application.publicationId === publication.id,
  );
  if (duplicate) return { ok: false as const, reason: "This profile already has an application for that job." };
  const application: Application = {
    id: `app-${catalog.applications.length + 2000}`,
    reference: `APP-2026-${1100 + catalog.applications.length}`,
    candidateId: candidate.id,
    jobOrderId: publication.jobOrderId,
    publicationId: publication.id,
    stage: "New application",
    source: "Agency portal",
    appliedOn: new Date().toISOString().slice(0, 10),
    recruiter: "Unassigned",
  };
  catalog.applications.push(application);
  return { ok: true as const, application: listApplications().find((item) => item.id === application.id)! };
}

export function updateApplicationStage(id: string, stage: ApplicationStage) {
  const application = demoCatalog().applications.find((item) => item.id === id);
  if (!application) return null;
  application.stage = stage;
  if (stage === "Selected") {
    const candidate = demoCatalog().candidates.find((item) => item.id === application.candidateId);
    if (candidate) candidate.status = "For processing";
    ensureProcessingForSelected();
  }
  return listApplications().find((item) => item.id === id) ?? null;
}

export type ApplicationHistoryEntry = {
  id: string;
  previousStage: string | null;
  newStage: string;
  createdAt: string;
  actorName: string | null;
};

/** Demo mode does not persist stage history. */
export function listApplicationHistory(applicationId: string): ApplicationHistoryEntry[] {
  void applicationId;
  return [];
}

export function updateCandidate(candidateId: string, patch: Partial<Candidate>) {
  const candidate = demoCatalog().candidates.find((item) => item.id === candidateId);
  if (!candidate) return null;
  if (typeof patch.fullName === "string") candidate.fullName = patch.fullName;
  if (typeof patch.mobile === "string") candidate.mobile = patch.mobile;
  if (typeof patch.preferredRole === "string") candidate.preferredRole = patch.preferredRole;
  if (typeof patch.experience === "string") candidate.experience = patch.experience;
  if (typeof patch.education === "string") candidate.education = patch.education;
  if (typeof patch.languages === "string") candidate.languages = patch.languages;
  if (typeof patch.preferredDestination === "string") candidate.preferredDestination = patch.preferredDestination;
  if (typeof patch.dateOfBirth === "string") candidate.dateOfBirth = patch.dateOfBirth;
  if (typeof patch.nationality === "string") candidate.nationality = patch.nationality;
  return listCandidates().find((item) => item.id === candidateId) ?? null;
}

export function importCandidates(rows: Array<{ fullName: string; email: string; source: Candidate["source"] }>) {
  const catalog = demoCatalog();
  const created: CandidateView[] = [];
  const duplicates: string[] = [];
  for (const row of rows) {
    const existing = catalog.candidates.find((candidate) => candidate.email.toLowerCase() === row.email.toLowerCase());
    if (existing) {
      duplicates.push(row.email);
      continue;
    }
    const candidate: Candidate = {
      id: `cand-${catalog.candidates.length + 50}`,
      reference: `CND-2026-${3000 + catalog.candidates.length}`,
      fullName: row.fullName,
      email: row.email,
      status: "Active",
      source: row.source,
      mobile: "",
      dateOfBirth: "",
      nationality: "",
      preferredRole: "",
      experience: "",
      education: "",
      languages: "",
      preferredDestination: "",
    };
    catalog.candidates.push(candidate);
    const view = listCandidates().find((item) => item.id === candidate.id);
    if (view) created.push(view);
  }
  return { created, duplicates };
}

export function ensureDemoCandidate(input: { fullName: string; email: string }) {
  const existing = demoCatalog().candidates.find((candidate) => candidate.email.toLowerCase() === input.email.toLowerCase());
  if (existing) return existing;
  const candidate: Candidate = {
    id: `cand-${demoCatalog().candidates.length + 80}`,
    reference: `CND-2026-${4000 + demoCatalog().candidates.length}`,
    fullName: input.fullName,
    email: input.email,
    status: "Active",
    source: "Agency portal",
    mobile: "",
    dateOfBirth: "",
    nationality: "Filipino",
    preferredRole: "",
    experience: "",
    education: "",
    languages: "",
    preferredDestination: "",
  };
  demoCatalog().candidates.push(candidate);
  return candidate;
}

export function moneySummary() {
  const transactions = listTransactions();
  const income = transactions.filter((item) => item.kind === "income").reduce((sum, item) => sum + centsFromDecimal(item.amountDecimal), 0);
  const expenses = transactions.filter((item) => item.kind === "expense").reduce((sum, item) => sum + centsFromDecimal(item.amountDecimal), 0);
  return {
    incomeCents: income,
    expenseCents: expenses,
    netCents: income - expenses,
    netDecimal: decimalFromCents(income - expenses),
  };
}
