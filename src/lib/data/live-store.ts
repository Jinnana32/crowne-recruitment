import { createSupabaseServerClient } from "@/lib/supabase/server";
import { crowneTables } from "@/lib/supabase/tables";
import { DataUnavailableError } from "@/lib/data/errors";
import type {
  ApplicationView,
  CandidateView,
  DashboardView,
  DeploymentView,
  EmployerView,
  JobOrderEdit,
  JobOrderView,
  ProcessingView,
  PublicJob,
  PublicJobDetail,
} from "@/lib/data/demo-store";
import type { DeleteResult, DocumentActor, DocumentEventAction, DocumentUpload, OpenResult, UploadResult } from "@/lib/data/document-store";
import type {
  Candidate,
  CandidateDocument,
  ChecklistItem,
  DeploymentRecord,
  DocumentRequest,
  DocumentsView,
  EducationEntry,
  FinanceTransaction,
  WorkExperienceEntry,
} from "@/lib/data/types";
import {
  displayNameFromFilename,
  DOCUMENT_BUCKET,
  documentStoragePath,
  downloadFilename,
  isDocumentMime,
  requestState,
  type DocumentSensitivity,
  type DocumentStatus,
} from "@/lib/domain/documents";
import type { DocumentRequestInput } from "@/lib/validation/api";
import { dateToMonth, monthToDate, profileCompleteness } from "@/lib/domain/profile";
import type { EducationInput, WorkExperienceInput } from "@/lib/validation/api";
import {
  checklistCompletionPercent,
  DEFAULT_PROCESSING_CHECKLIST,
  DEMO_MEDICAL_EXPENSE,
  DEMO_PLACEMENT_INCOME,
  isChecklistComplete,
  MEDICAL_CHECKLIST_LABEL,
  nextActionFromChecklist,
} from "@/lib/domain/processing";
import { FULFILLMENT_NOTE, fulfillmentPercent, isApplicationStage, PIPELINE_COLUMNS } from "@/lib/domain/stages";
import type { ApplicationStage } from "@/lib/domain/stages";
import { centsFromDecimal } from "@/lib/domain/money";

type JobOpeningInput = {
  employerName: string;
  country: string;
  title: string;
  vacancies: number;
  category: string;
  employmentType: string;
  salaryLabel: string;
  description: string;
};

type PublicationRow = {
  id: string;
  category: string | null;
  employment_type: string | null;
  salary_label: string | null;
  description: string | null;
  published: boolean;
};

type PublicJobRow = {
  id: string;
  title: string;
  employer: string;
  country: string;
  category: string | null;
  vacancies: number;
  employment_type: string | null;
  salary_label: string | null;
  job_order_reference: string;
  description: string | null;
  qualifications: string[] | null;
  responsibilities: string[] | null;
};

async function client() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new DataUnavailableError("Supabase is not configured.");
  }
  return supabase;
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function reference(prefix: string) {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix}-${day}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function asStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toPublicJob(row: PublicJobRow): PublicJobDetail {
  return {
    id: row.id,
    title: row.title,
    employer: row.employer,
    country: row.country,
    category: row.category ?? "",
    vacancies: row.vacancies,
    employmentType: row.employment_type ?? "",
    salaryLabel: row.salary_label ?? "",
    jobOrderReference: row.job_order_reference,
    description: row.description ?? "",
    qualifications: asStrings(row.qualifications),
    responsibilities: asStrings(row.responsibilities),
  };
}

export async function listPublicJobs(filters: { query?: string; country?: string; category?: string }): Promise<PublicJob[]> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("crowne_list_public_jobs");
  fail(error);
  const query = filters.query?.trim().toLowerCase() ?? "";
  return ((data ?? []) as PublicJobRow[])
    .map(toPublicJob)
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

export async function getPublicJob(id: string): Promise<PublicJobDetail | null> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("crowne_list_public_jobs", { job_id: id });
  fail(error);
  const row = ((data ?? []) as PublicJobRow[])[0];
  return row ? toPublicJob(row) : null;
}

export async function createJobOpening(input: JobOpeningInput): Promise<JobOrderView> {
  const supabase = await client();
  const { data: employer, error: employerError } = await supabase
    .from(crowneTables.employers)
    .insert({
      name: input.employerName,
      country: input.country,
      status: "Active",
      contact_name: "",
    })
    .select("id")
    .single();
  fail(employerError);
  if (!employer) throw new Error("The employer could not be saved.");

  const { data: order, error: orderError } = await supabase
    .from(crowneTables.jobOrders)
    .insert({
      reference: reference("JO"),
      employer_id: employer?.id,
      title: input.title,
      country: input.country,
      vacancies: input.vacancies,
      status: "Recruiting",
      channels: ["Website"],
    })
    .select("id")
    .single();
  fail(orderError);
  if (!order) throw new Error("The job order could not be saved.");

  const { error: publicationError } = await supabase.from(crowneTables.publications).insert({
    job_order_id: order.id,
    title: input.title,
    category: input.category,
    employment_type: input.employmentType,
    salary_label: input.salaryLabel,
    description: input.description,
    qualifications: [],
    responsibilities: [],
    published: true,
  });
  fail(publicationError);

  const orders = await listJobOrders();
  const created = orders.find((item) => item.id === order?.id);
  if (!created) throw new Error("The job order could not be read after it was saved.");
  return created;
}

export async function updateJobOrder(id: string, input: JobOrderEdit): Promise<JobOrderView | null> {
  const supabase = await client();
  const { data: existing, error: existingError } = await supabase
    .from(crowneTables.jobOrders)
    .select("id")
    .eq("id", id)
    .maybeSingle();
  fail(existingError);
  if (!existing) return null;

  const { error: orderError } = await supabase
    .from(crowneTables.jobOrders)
    .update({
      title: input.title,
      country: input.country,
      vacancies: input.vacancies,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  fail(orderError);

  const { error: publicationError } = await supabase
    .from(crowneTables.publications)
    .update({
      title: input.title,
      category: input.category,
      employment_type: input.employmentType,
      salary_label: input.salaryLabel,
      description: input.description,
      published: input.published,
      updated_at: new Date().toISOString(),
    })
    .eq("job_order_id", id);
  fail(publicationError);

  return (await listJobOrders()).find((item) => item.id === id) ?? null;
}

export async function listJobOrders(): Promise<JobOrderView[]> {
  const supabase = await client();
  const { data, error } = await supabase.from(crowneTables.jobOrders).select(`
    id, reference, title, country, vacancies, status, channels,
    ${crowneTables.employers} (name),
    ${crowneTables.applications} (stage),
    ${crowneTables.publications} (id, category, employment_type, salary_label, description, published)
  `);
  fail(error);
  return (data ?? []).map((row) => {
    const record = row as {
      id: string;
      reference: string;
      title: string;
      country: string;
      vacancies: number;
      status: JobOrderView["status"];
      channels: JobOrderView["channels"];
      crowne_employers: { name: string } | { name: string }[] | null;
      crowne_applications: Array<{ stage: string }> | null;
      crowne_job_publications: PublicationRow | PublicationRow[] | null;
    };
    const applications = record.crowne_applications ?? [];
    const selected = applications.filter((application) => application.stage === "Selected").length;
    const publications = Array.isArray(record.crowne_job_publications)
      ? record.crowne_job_publications
      : record.crowne_job_publications
        ? [record.crowne_job_publications]
        : [];
    const publication = publications.find((item) => item.published) ?? publications[0] ?? null;
    return {
      id: record.id,
      reference: record.reference,
      title: record.title,
      employer: one(record.crowne_employers)?.name ?? "Employer",
      country: record.country,
      vacancies: record.vacancies,
      applicants: applications.length,
      selected,
      fulfillmentPercent: fulfillmentPercent(selected, record.vacancies),
      channels: record.channels ?? [],
      status: record.status,
      publicationId: publication?.id ?? null,
      category: publication?.category ?? "",
      employmentType: publication?.employment_type ?? "",
      salaryLabel: publication?.salary_label ?? "",
      description: publication?.description ?? "",
      published: publication?.published ?? false,
    };
  });
}

export async function listEmployers(): Promise<EmployerView[]> {
  const supabase = await client();
  const { data, error } = await supabase.from(crowneTables.employers).select(`
    id, name, country, status, contact_name,
    ${crowneTables.jobOrders} (id)
  `);
  fail(error);
  return (data ?? []).map((row) => {
    const record = row as {
      id: string;
      name: string;
      country: string;
      status: EmployerView["status"];
      contact_name: string | null;
      crowne_job_orders: Array<{ id: string }> | null;
    };
    return {
      id: record.id,
      name: record.name,
      country: record.country,
      status: record.status,
      contactName: record.contact_name ?? "",
      jobOrders: record.crowne_job_orders?.length ?? 0,
    };
  });
}

export async function listApplications(): Promise<ApplicationView[]> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("crowne_visible_applications");
  fail(error);
  return ((data ?? []) as Array<{
    id: string;
    reference: string;
    candidate_id: string;
    candidate_name: string;
    job_title: string;
    country: string;
    employer: string;
    stage: string;
    source: ApplicationView["source"];
    applied_on: string;
    recruiter: string | null;
  }>).flatMap((row) => {
    if (!isApplicationStage(row.stage)) return [];
    return [{
      id: row.id,
      reference: row.reference,
      candidateId: row.candidate_id,
      candidateName: row.candidate_name,
      jobTitle: row.job_title,
      country: row.country,
      employer: row.employer,
      stage: row.stage,
      source: row.source,
      appliedOn: row.applied_on,
      recruiter: row.recruiter ?? "Unassigned",
    }];
  });
}

export async function createApplication(input: { candidateId: string; publicationId: string }) {
  const supabase = await client();
  const { data: jobOrderId, error: lookupError } = await supabase.rpc("crowne_published_job_order_id", {
    publication_id: input.publicationId,
  });
  fail(lookupError);
  if (!jobOrderId) return { ok: false as const, reason: "That job is not open for applications." };

  const { data: userData } = await supabase.auth.getUser();
  const { data: inserted, error } = await supabase
    .from(crowneTables.applications)
    .insert({
      reference: reference("APP"),
      candidate_id: input.candidateId,
      job_order_id: jobOrderId,
      publication_id: input.publicationId,
      stage: "New application",
      source: "Agency portal",
      applied_on: new Date().toISOString().slice(0, 10),
      recruiter: "Unassigned",
    })
    .select("id")
    .single();
  if (error?.code === "23505") {
    return { ok: false as const, reason: "This profile already has an application for that job." };
  }
  fail(error);
  if (!inserted) throw new Error("The application could not be saved.");

  await supabase.from(crowneTables.history).insert({
    application_id: inserted.id,
    previous_stage: null,
    new_stage: "New application",
    actor_id: userData.user?.id ?? null,
  });

  const application = (await listApplications()).find((item) => item.id === inserted?.id);
  if (!application) return { ok: false as const, reason: "The application was saved but could not be read back." };
  return { ok: true as const, application };
}

export async function updateApplicationStage(id: string, stage: ApplicationStage) {
  const supabase = await client();
  const { data: current, error: readError } = await supabase
    .from(crowneTables.applications)
    .select("stage, candidate_id")
    .eq("id", id)
    .maybeSingle();
  fail(readError);
  if (!current) return null;

  const { error } = await supabase
    .from(crowneTables.applications)
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);
  fail(error);

  const { data: userData } = await supabase.auth.getUser();
  await supabase.from(crowneTables.history).insert({
    application_id: id,
    previous_stage: current.stage,
    new_stage: stage,
    actor_id: userData.user?.id ?? null,
  });

  if (stage === "Selected") {
    await supabase
      .from(crowneTables.candidates)
      .update({ status: "For processing", updated_at: new Date().toISOString() })
      .eq("id", current.candidate_id);
    await ensureProcessingRecord(id);
  }

  return (await listApplications()).find((item) => item.id === id) ?? null;
}

async function ensureProcessingRecord(applicationId: string) {
  const supabase = await client();
  const { data: existing, error: existingError } = await supabase
    .from(crowneTables.processing)
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();
  fail(existingError);
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from(crowneTables.processing)
    .insert({
      reference: reference("PRC"),
      application_id: applicationId,
      next_action: nextActionFromChecklist(DEFAULT_PROCESSING_CHECKLIST),
      status: "In progress",
    })
    .select("id")
    .single();
  fail(error);
  if (!created) throw new DataUnavailableError("The processing record could not be created.");
  const { error: checklistError } = await supabase.from(crowneTables.checklist).insert(
    DEFAULT_PROCESSING_CHECKLIST.map((item) => ({
      processing_record_id: created.id,
      label: item.label,
      state: item.state,
      sensitivity: item.sensitivity,
    })),
  );
  fail(checklistError);
  return created.id;
}

async function ensureProcessingForSelected() {
  const supabase = await client();
  const { data: selected, error } = await supabase
    .from(crowneTables.applications)
    .select("id")
    .eq("stage", "Selected");
  fail(error);
  const { data: existing, error: existingError } = await supabase
    .from(crowneTables.processing)
    .select("application_id");
  fail(existingError);
  const have = new Set((existing ?? []).map((row) => row.application_id as string));
  for (const row of selected ?? []) {
    if (!have.has(row.id)) await ensureProcessingRecord(row.id);
  }
}

export type ApplicationHistoryEntry = {
  id: string;
  previousStage: string | null;
  newStage: string;
  createdAt: string;
  actorName: string | null;
};

export async function listApplicationHistory(applicationId: string): Promise<ApplicationHistoryEntry[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from(crowneTables.history)
    .select("id, previous_stage, new_stage, created_at, actor_id")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  fail(error);
  const rows = (data ?? []) as Array<{
    id: string;
    previous_stage: string | null;
    new_stage: string;
    created_at: string;
    actor_id: string | null;
  }>;
  const actorIds = [...new Set(rows.map((row) => row.actor_id).filter((id): id is string => Boolean(id)))];
  const names = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from(crowneTables.profiles)
      .select("id, full_name")
      .in("id", actorIds);
    fail(profileError);
    for (const profile of profiles ?? []) {
      if (profile.full_name) names.set(profile.id, profile.full_name);
    }
  }
  return rows.map((row) => ({
    id: row.id,
    previousStage: row.previous_stage,
    newStage: row.new_stage,
    createdAt: row.created_at,
    actorName: row.actor_id ? names.get(row.actor_id) ?? null : null,
  }));
}

type CandidateRow = {
  id: string;
  reference: string;
  full_name: string;
  email: string | null;
  status: Candidate["status"];
  source: Candidate["source"];
  mobile: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  preferred_role: string | null;
  experience: string | null;
  education: string | null;
  languages: string | null;
  preferred_destination: string | null;
  crowne_applications: Array<{ reference: string; applied_on: string }> | null;
  crowne_candidate_work_experience: Array<{ id: string }> | null;
  crowne_candidate_education: Array<{ id: string }> | null;
};

function toCandidate(row: CandidateRow): CandidateView {
  const applications = [...(row.crowne_applications ?? [])].sort((left, right) => right.applied_on.localeCompare(left.applied_on));
  const candidate: Candidate = {
    id: row.id,
    reference: row.reference,
    fullName: row.full_name,
    email: row.email ?? "",
    status: row.status,
    source: row.source,
    mobile: row.mobile ?? "",
    dateOfBirth: row.date_of_birth ?? "",
    nationality: row.nationality ?? "",
    preferredRole: row.preferred_role ?? "",
    experience: row.experience ?? "",
    education: row.education ?? "",
    languages: row.languages ?? "",
    preferredDestination: row.preferred_destination ?? "",
  };
  const counts = {
    workExperienceCount: row.crowne_candidate_work_experience?.length ?? 0,
    educationCount: row.crowne_candidate_education?.length ?? 0,
  };
  return {
    ...candidate,
    latestApplication: applications[0]?.reference ?? "None",
    applicationCount: applications.length,
    profileCompleteness: profileCompleteness(candidate, counts),
    ...counts,
  };
}

export async function listCandidates(): Promise<CandidateView[]> {
  const supabase = await client();
  const { data, error } = await supabase.from(crowneTables.candidates).select(`
    id, reference, full_name, email, status, source, mobile, date_of_birth, nationality,
    preferred_role, experience, education, languages, preferred_destination,
    ${crowneTables.applications} (reference, applied_on),
    ${crowneTables.workExperience} (id),
    ${crowneTables.education} (id)
  `);
  fail(error);
  return ((data ?? []) as CandidateRow[]).map(toCandidate);
}

export async function updateCandidate(candidateId: string, patch: Partial<Candidate>) {
  const supabase = await client();
  const changes: Record<string, string> = {};
  if (typeof patch.fullName === "string") changes.full_name = patch.fullName;
  if (typeof patch.mobile === "string") changes.mobile = patch.mobile;
  if (typeof patch.preferredRole === "string") changes.preferred_role = patch.preferredRole;
  if (typeof patch.experience === "string") changes.experience = patch.experience;
  if (typeof patch.education === "string") changes.education = patch.education;
  if (typeof patch.languages === "string") changes.languages = patch.languages;
  if (typeof patch.preferredDestination === "string") changes.preferred_destination = patch.preferredDestination;
  if (typeof patch.nationality === "string") changes.nationality = patch.nationality;
  const dateOfBirth = typeof patch.dateOfBirth === "string" ? patch.dateOfBirth || null : undefined;
  const { error } = await supabase.from(crowneTables.candidates).update({ ...changes, ...(dateOfBirth !== undefined ? { date_of_birth: dateOfBirth } : {}), updated_at: new Date().toISOString() }).eq("id", candidateId);
  fail(error);
  if (typeof patch.fullName === "string") {
    const { data: candidate } = await supabase.from(crowneTables.candidates).select("profile_id").eq("id", candidateId).maybeSingle();
    if (candidate?.profile_id) {
      await supabase.from(crowneTables.profiles).update({ full_name: patch.fullName, updated_at: new Date().toISOString() }).eq("id", candidate.profile_id);
    }
  }
  return (await listCandidates()).find((candidate) => candidate.id === candidateId) ?? null;
}

type WorkExperienceRow = {
  id: string;
  candidate_id: string;
  job_title: string;
  employer_name: string;
  country: string | null;
  start_month: string;
  end_month: string | null;
  is_current: boolean;
  description: string | null;
};

type EducationRow = {
  id: string;
  candidate_id: string;
  qualification: string;
  school: string;
  field_of_study: string | null;
  start_month: string;
  end_month: string | null;
  is_current: boolean;
};

const workExperienceColumns = "id, candidate_id, job_title, employer_name, country, start_month, end_month, is_current, description";
const educationColumns = "id, candidate_id, qualification, school, field_of_study, start_month, end_month, is_current";

function toWorkExperience(row: WorkExperienceRow): WorkExperienceEntry {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    jobTitle: row.job_title,
    employerName: row.employer_name,
    country: row.country ?? "",
    startMonth: dateToMonth(row.start_month),
    endMonth: dateToMonth(row.end_month),
    isCurrent: row.is_current,
    description: row.description ?? "",
  };
}

function toEducation(row: EducationRow): EducationEntry {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    qualification: row.qualification,
    school: row.school,
    fieldOfStudy: row.field_of_study ?? "",
    startMonth: dateToMonth(row.start_month),
    endMonth: dateToMonth(row.end_month),
    isCurrent: row.is_current,
  };
}

function entryPeriod(input: { startMonth: string; endMonth?: string; isCurrent: boolean }) {
  return {
    start_month: monthToDate(input.startMonth),
    end_month: input.isCurrent || !input.endMonth ? null : monthToDate(input.endMonth),
    is_current: input.isCurrent,
  };
}

export async function listWorkExperience(candidateId: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from(crowneTables.workExperience)
    .select(workExperienceColumns)
    .eq("candidate_id", candidateId)
    .order("is_current", { ascending: false })
    .order("start_month", { ascending: false });
  fail(error);
  return (data ?? []).map(toWorkExperience);
}

export async function saveWorkExperience(candidateId: string, input: WorkExperienceInput, entryId?: string) {
  const supabase = await client();
  const values = {
    job_title: input.jobTitle,
    employer_name: input.employerName,
    country: input.country || null,
    description: input.description || null,
    ...entryPeriod(input),
  };
  const query = entryId
    ? supabase.from(crowneTables.workExperience).update({ ...values, updated_at: new Date().toISOString() }).eq("id", entryId).eq("candidate_id", candidateId)
    : supabase.from(crowneTables.workExperience).insert({ ...values, candidate_id: candidateId });
  const { data, error } = await query.select(workExperienceColumns).maybeSingle();
  fail(error);
  return data ? toWorkExperience(data) : null;
}

export async function deleteWorkExperience(candidateId: string, entryId: string) {
  const supabase = await client();
  const { data, error } = await supabase.from(crowneTables.workExperience).delete().eq("id", entryId).eq("candidate_id", candidateId).select("id");
  fail(error);
  return (data ?? []).length > 0;
}

export async function listEducation(candidateId: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from(crowneTables.education)
    .select(educationColumns)
    .eq("candidate_id", candidateId)
    .order("is_current", { ascending: false })
    .order("start_month", { ascending: false });
  fail(error);
  return (data ?? []).map(toEducation);
}

export async function saveEducation(candidateId: string, input: EducationInput, entryId?: string) {
  const supabase = await client();
  const values = {
    qualification: input.qualification,
    school: input.school,
    field_of_study: input.fieldOfStudy || null,
    ...entryPeriod(input),
  };
  const query = entryId
    ? supabase.from(crowneTables.education).update({ ...values, updated_at: new Date().toISOString() }).eq("id", entryId).eq("candidate_id", candidateId)
    : supabase.from(crowneTables.education).insert({ ...values, candidate_id: candidateId });
  const { data, error } = await query.select(educationColumns).maybeSingle();
  fail(error);
  return data ? toEducation(data) : null;
}

export async function deleteEducation(candidateId: string, entryId: string) {
  const supabase = await client();
  const { data, error } = await supabase.from(crowneTables.education).delete().eq("id", entryId).eq("candidate_id", candidateId).select("id");
  fail(error);
  return (data ?? []).length > 0;
}

const documentColumns = "id, candidate_id, name, request_id, original_filename, mime_type, size_bytes, storage_path, uploaded_at, status, sensitivity";
const requestColumns = "id, candidate_id, name, description, sensitivity, created_at";

type DocumentRow = {
  id: string;
  candidate_id: string;
  name: string;
  request_id: string | null;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string | null;
  uploaded_at: string;
  status: string;
  sensitivity: string;
};

type RequestRow = {
  id: string;
  candidate_id: string;
  name: string;
  description: string | null;
  sensitivity: string;
  created_at: string;
};

function toDocument(row: DocumentRow): CandidateDocument {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    name: row.name,
    requestId: row.request_id,
    originalFilename: row.original_filename,
    mimeType: isDocumentMime(row.mime_type) ? row.mime_type : null,
    sizeBytes: row.size_bytes,
    hasFile: Boolean(row.storage_path),
    uploadedAt: row.uploaded_at,
    status: row.status === "Verified" ? "Verified" : "For review",
    sensitivity: row.sensitivity === "medical" ? "medical" : "standard",
  };
}

function toRequest(row: RequestRow, documents: CandidateDocument[]): DocumentRequest {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    name: row.name,
    description: row.description ?? "",
    sensitivity: row.sensitivity === "medical" ? "medical" : "standard",
    requestedAt: row.created_at,
    ...requestState(row.id, documents),
  };
}

type Supabase = Awaited<ReturnType<typeof client>>;

async function logDocumentEvent(supabase: Supabase, candidateId: string, documentId: string | null, action: DocumentEventAction) {
  const { error } = await supabase.from(crowneTables.documentEvents).insert({ candidate_id: candidateId, document_id: documentId, action });
  fail(error);
}

export async function listDocuments(candidateId: string): Promise<DocumentsView> {
  const supabase = await client();
  const [documents, requests] = await Promise.all([
    supabase.from(crowneTables.documents).select(documentColumns).eq("candidate_id", candidateId).order("uploaded_at", { ascending: false }),
    supabase.from(crowneTables.documentRequests).select(requestColumns).eq("candidate_id", candidateId).order("created_at", { ascending: true }),
  ]);
  fail(documents.error);
  fail(requests.error);
  const mapped = (documents.data ?? []).map(toDocument);
  return { documents: mapped, requests: (requests.data ?? []).map((row) => toRequest(row, mapped)) };
}

export async function uploadDocument(input: DocumentUpload): Promise<UploadResult> {
  const supabase = await client();
  let sensitivity: DocumentSensitivity = "standard";
  let name = input.name;
  if (input.requestId) {
    const { data: request, error } = await supabase
      .from(crowneTables.documentRequests)
      .select("id, name, sensitivity")
      .eq("id", input.requestId)
      .eq("candidate_id", input.candidateId)
      .maybeSingle();
    fail(error);
    if (!request) return { ok: false, reason: "request_not_found" };
    sensitivity = request.sensitivity === "medical" ? "medical" : "standard";
    name ||= request.name;
  }
  name ||= displayNameFromFilename(input.originalFilename);

  const path = documentStoragePath(input.candidateId, sensitivity, input.mime);
  const stored = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, input.bytes, { contentType: input.mime, upsert: false });
  fail(stored.error);

  const { data, error } = await supabase
    .from(crowneTables.documents)
    .insert({
      candidate_id: input.candidateId,
      name,
      request_id: input.requestId,
      original_filename: input.originalFilename.slice(0, 255),
      mime_type: input.mime,
      size_bytes: input.bytes.byteLength,
      storage_path: path,
      status: "For review",
      sensitivity,
      uploaded_by: input.actorId,
    })
    .select(documentColumns)
    .single();
  if (error) {
    // Applicants cannot remove medical objects, so a failed medical insert leaves the object for staff cleanup.
    if (sensitivity === "standard") await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
    fail(error);
  }
  const document = toDocument(data as DocumentRow);
  await logDocumentEvent(supabase, input.candidateId, document.id, "uploaded");
  return { ok: true, document };
}

export async function deleteDocument(candidateId: string, documentId: string): Promise<DeleteResult> {
  const supabase = await client();
  const { data: row, error } = await supabase
    .from(crowneTables.documents)
    .select(documentColumns)
    .eq("id", documentId)
    .eq("candidate_id", candidateId)
    .maybeSingle();
  fail(error);
  if (!row) return "not_found";
  if (row.sensitivity !== "standard" || row.status !== "For review") return "locked";
  const removed = await supabase.from(crowneTables.documents).delete().eq("id", documentId).eq("candidate_id", candidateId).select("id");
  fail(removed.error);
  if ((removed.data ?? []).length === 0) return "locked";
  if (row.storage_path) {
    const { error: storageError } = await supabase.storage.from(DOCUMENT_BUCKET).remove([row.storage_path]);
    if (storageError) console.error("Document object was not removed", documentId);
  }
  await logDocumentEvent(supabase, candidateId, documentId, "deleted");
  return "deleted";
}

export async function openDocument(documentId: string, actor: DocumentActor): Promise<OpenResult> {
  const supabase = await client();
  const { data: row, error } = await supabase.from(crowneTables.documents).select(documentColumns).eq("id", documentId).maybeSingle();
  fail(error);
  if (!row || (actor.role === "applicant" && row.candidate_id !== actor.candidateId)) return { kind: "not_found" };
  if (row.sensitivity === "medical" && actor.role === "applicant") return { kind: "restricted" };
  if (!row.storage_path || !isDocumentMime(row.mime_type)) return { kind: "no_file" };
  const file = await supabase.storage.from(DOCUMENT_BUCKET).download(row.storage_path);
  if (file.error || !file.data) return { kind: "restricted" };
  await logDocumentEvent(supabase, row.candidate_id, row.id, "opened");
  return { kind: "file", bytes: new Uint8Array(await file.data.arrayBuffer()), mime: row.mime_type, filename: downloadFilename(row.name, row.mime_type) };
}

export async function reviewDocument(documentId: string, status: DocumentStatus) {
  const supabase = await client();
  const { data, error } = await supabase.from(crowneTables.documents).update({ status }).eq("id", documentId).select(documentColumns).maybeSingle();
  fail(error);
  if (!data) return null;
  if (status === "Verified") await logDocumentEvent(supabase, data.candidate_id, data.id, "verified");
  return toDocument(data);
}

export async function createDocumentRequest(candidateId: string, input: DocumentRequestInput, actorId: string | null) {
  const supabase = await client();
  const { data: candidate, error: candidateError } = await supabase.from(crowneTables.candidates).select("id").eq("id", candidateId).maybeSingle();
  fail(candidateError);
  if (!candidate) return null;
  const { data, error } = await supabase
    .from(crowneTables.documentRequests)
    .insert({ candidate_id: candidateId, name: input.name, description: input.description || null, sensitivity: input.sensitivity, requested_by: actorId })
    .select(requestColumns)
    .single();
  fail(error);
  await logDocumentEvent(supabase, candidateId, null, "requested");
  return toRequest(data as RequestRow, []);
}

export async function deleteDocumentRequest(candidateId: string, requestId: string) {
  const supabase = await client();
  const { data, error } = await supabase.from(crowneTables.documentRequests).delete().eq("id", requestId).eq("candidate_id", candidateId).select("id");
  fail(error);
  if ((data ?? []).length === 0) return false;
  await logDocumentEvent(supabase, candidateId, null, "request_removed");
  return true;
}

export async function importCandidates(rows: Array<{ fullName: string; email: string; source: Candidate["source"] }>) {
  const supabase = await client();
  const { data: existing, error } = await supabase.from(crowneTables.candidates).select("email");
  fail(error);
  const known = new Set((existing ?? []).map((row) => (row.email ?? "").toLowerCase()));
  const created: CandidateView[] = [];
  const duplicates: string[] = [];
  for (const row of rows) {
    if (known.has(row.email.toLowerCase())) {
      duplicates.push(row.email);
      continue;
    }
    const { error: insertError } = await supabase.from(crowneTables.candidates).insert({
      reference: reference("CND"),
      full_name: row.fullName,
      email: row.email,
      status: "Active",
      source: row.source,
    });
    if (insertError) {
      duplicates.push(row.email);
      continue;
    }
    known.add(row.email.toLowerCase());
  }
  const all = await listCandidates();
  for (const row of rows) {
    if (duplicates.includes(row.email)) continue;
    const view = all.find((candidate) => candidate.email.toLowerCase() === row.email.toLowerCase());
    if (view) created.push(view);
  }
  return { created, duplicates };
}

export async function listProcessing(): Promise<ProcessingView[]> {
  await ensureProcessingForSelected();
  const supabase = await client();
  const [{ data, error }, { data: deploymentRows, error: deploymentError }] = await Promise.all([
    supabase.from(crowneTables.processing).select(`
      id, reference, next_action, status, application_id,
      ${crowneTables.checklist} (label, state),
      ${crowneTables.applications} (
        id, stage,
        ${crowneTables.candidates} (full_name),
        ${crowneTables.jobOrders} (title, country)
      )
    `),
    supabase.from(crowneTables.deployments).select("application_id"),
  ]);
  fail(error);
  fail(deploymentError);
  const deployed = new Set((deploymentRows ?? []).map((row) => row.application_id as string));
  return (data ?? []).flatMap((row) => {
    const record = row as unknown as {
      id: string;
      reference: string;
      next_action: string | null;
      status: ProcessingView["status"];
      application_id: string;
      crowne_processing_checklist_items: Array<{ label: string; state: ProcessingView["checklist"][number]["state"] }> | null;
      crowne_applications:
        | {
            id: string;
            stage: string;
            crowne_candidates: { full_name: string } | { full_name: string }[] | null;
            crowne_job_orders: { title: string; country: string } | Array<{ title: string; country: string }> | null;
          }
        | null;
    };
    const application = record.crowne_applications;
    if (!application || application.stage !== "Selected") return [];
    const checklist = record.crowne_processing_checklist_items ?? [];
    const order = one(application.crowne_job_orders);
    return [{
      id: record.id,
      reference: record.reference,
      applicationId: application.id,
      candidateName: one(application.crowne_candidates)?.full_name ?? "Candidate",
      jobTitle: order?.title ?? "Job",
      country: order?.country ?? "",
      checklist,
      completionPercent: checklistCompletionPercent(checklist),
      nextAction: record.next_action ?? "",
      status: record.status,
      hasDeployment: deployed.has(application.id),
    }];
  });
}

export async function updateChecklistItem(processingId: string, label: string, state: ChecklistItem["state"]) {
  const supabase = await client();
  const { data: record, error: readError } = await supabase
    .from(crowneTables.processing)
    .select(`id, reference, status, application_id, ${crowneTables.checklist} (id, label, state)`)
    .eq("id", processingId)
    .maybeSingle();
  fail(readError);
  if (!record) return { ok: false as const, reason: "not_found" as const };
  if (record.status === "Ready") return { ok: false as const, reason: "already_ready" as const };

  const items = (record as { crowne_processing_checklist_items: Array<{ id: string; label: string; state: string }> | null })
    .crowne_processing_checklist_items ?? [];
  const item = items.find((entry) => entry.label === label);
  if (!item) return { ok: false as const, reason: "item_not_found" as const };
  if (label === MEDICAL_CHECKLIST_LABEL && state !== "Pending" && state !== "Passed") {
    return { ok: false as const, reason: "invalid_state" as const };
  }
  if (label !== MEDICAL_CHECKLIST_LABEL && state !== "Pending" && state !== "Done") {
    return { ok: false as const, reason: "invalid_state" as const };
  }

  const { error: updateError } = await supabase.from(crowneTables.checklist).update({ state }).eq("id", item.id);
  fail(updateError);

  const nextChecklist = items.map((entry) =>
    entry.id === item.id ? { label: entry.label, state } : { label: entry.label, state: entry.state as ChecklistItem["state"] },
  );
  const { error: nextError } = await supabase
    .from(crowneTables.processing)
    .update({ next_action: nextActionFromChecklist(nextChecklist), updated_at: new Date().toISOString() })
    .eq("id", processingId);
  fail(nextError);

  if (label === MEDICAL_CHECKLIST_LABEL && state === "Passed") {
    await ensureMedicalExpense(processingId, record.reference, record.application_id);
  }

  const view = (await listProcessing()).find((entry) => entry.id === processingId);
  if (!view) return { ok: false as const, reason: "not_found" as const };
  return { ok: true as const, record: view };
}

export async function markProcessingReady(processingId: string) {
  const rows = await listProcessing();
  const view = rows.find((item) => item.id === processingId);
  if (!view) return { ok: false as const, reason: "not_found" as const };
  if (!isChecklistComplete(view.checklist)) return { ok: false as const, reason: "incomplete" as const };

  const supabase = await client();
  const { error } = await supabase
    .from(crowneTables.processing)
    .update({ status: "Ready", next_action: "Schedule departure", updated_at: new Date().toISOString() })
    .eq("id", processingId);
  fail(error);
  const updated = (await listProcessing()).find((item) => item.id === processingId);
  if (!updated) return { ok: false as const, reason: "not_found" as const };
  return { ok: true as const, record: updated };
}

async function ensureMedicalExpense(processingId: string, processingReference: string, applicationId: string) {
  const supabase = await client();
  const { data: application } = await supabase
    .from(crowneTables.applications)
    .select(`${crowneTables.candidates} (full_name)`)
    .eq("id", applicationId)
    .maybeSingle();
  const name =
    one(
      (application as { crowne_candidates: { full_name: string } | { full_name: string }[] | null } | null)?.crowne_candidates ?? null,
    )?.full_name ?? "Candidate";
  const related = `${name} · ${processingReference}`;
  const { data: existing } = await supabase
    .from(crowneTables.transactions)
    .select("id")
    .eq("related_record", related)
    .eq("description", MEDICAL_CHECKLIST_LABEL)
    .eq("kind", "expense")
    .maybeSingle();
  if (existing) return;
  void processingId;
  const { error } = await supabase.from(crowneTables.transactions).insert({
    reference: reference("TRX"),
    description: MEDICAL_CHECKLIST_LABEL,
    related_record: related,
    recorded_on: new Date().toISOString().slice(0, 10),
    amount: Number(DEMO_MEDICAL_EXPENSE),
    currency: "PHP",
    status: "Approved",
    kind: "expense",
  });
  fail(error);
}

export async function createDeploymentFromProcessing(processingId: string, departureDate: string) {
  const rows = await listProcessing();
  const view = rows.find((item) => item.id === processingId);
  if (!view) return { ok: false as const, reason: "not_found" as const };
  if (view.status !== "Ready") return { ok: false as const, reason: "not_ready" as const };
  if (view.hasDeployment) return { ok: false as const, reason: "exists" as const };

  const supabase = await client();
  const { data: created, error } = await supabase
    .from(crowneTables.deployments)
    .insert({
      reference: reference("DEP"),
      application_id: view.applicationId,
      departure_date: departureDate,
      travel_status: "Booking pending",
      readiness: "Ready",
    })
    .select("id")
    .single();
  fail(error);
  if (!created) return { ok: false as const, reason: "not_found" as const };

  await supabase
    .from(crowneTables.processing)
    .update({ next_action: "Departure scheduled", updated_at: new Date().toISOString() })
    .eq("id", processingId);

  const related = `${view.candidateName} · ${view.jobTitle} · ${view.country}`;
  const { data: existingIncome } = await supabase
    .from(crowneTables.transactions)
    .select("id")
    .eq("related_record", related)
    .eq("description", "Employer placement fee")
    .eq("kind", "income")
    .maybeSingle();
  if (!existingIncome) {
    const { error: incomeError } = await supabase.from(crowneTables.transactions).insert({
      reference: reference("TRX"),
      description: "Employer placement fee",
      related_record: related,
      recorded_on: new Date().toISOString().slice(0, 10),
      amount: Number(DEMO_PLACEMENT_INCOME),
      currency: "PHP",
      status: "Posted",
      kind: "income",
    });
    fail(incomeError);
  }

  const deployment = (await listDeployments()).find((item) => item.id === created.id);
  if (!deployment) return { ok: false as const, reason: "not_found" as const };
  return { ok: true as const, deployment };
}

export async function updateDeployment(
  deploymentId: string,
  patch: { travelStatus?: DeploymentRecord["travelStatus"]; readiness?: DeploymentRecord["readiness"] },
) {
  const supabase = await client();
  const { error } = await supabase
    .from(crowneTables.deployments)
    .update({
      updated_at: new Date().toISOString(),
      ...(patch.travelStatus ? { travel_status: patch.travelStatus } : {}),
      ...(patch.readiness ? { readiness: patch.readiness } : {}),
    })
    .eq("id", deploymentId);
  fail(error);
  return (await listDeployments()).find((item) => item.id === deploymentId) ?? null;
}

export async function listDeployments(): Promise<DeploymentView[]> {
  const supabase = await client();
  const { data, error } = await supabase.from(crowneTables.deployments).select(`
    id, reference, departure_date, travel_status, readiness, application_id,
    ${crowneTables.applications} (
      id,
      ${crowneTables.candidates} (full_name),
      ${crowneTables.jobOrders} (title, country, ${crowneTables.employers} (name))
    )
  `);
  fail(error);
  return (data ?? []).flatMap((row) => {
    const record = row as unknown as {
      id: string;
      reference: string;
      departure_date: string | null;
      travel_status: DeploymentView["travelStatus"];
      readiness: DeploymentView["readiness"];
      application_id: string;
      crowne_applications: {
        id: string;
        crowne_candidates: { full_name: string } | { full_name: string }[] | null;
        crowne_job_orders:
          | { title: string; country: string; crowne_employers: { name: string } | { name: string }[] | null }
          | Array<{ title: string; country: string; crowne_employers: { name: string } | { name: string }[] | null }>
          | null;
      } | null;
    };
    const application = record.crowne_applications;
    const order = one(application?.crowne_job_orders ?? null);
    if (!application || !order) return [];
    return [{
      id: record.id,
      reference: record.reference,
      applicationId: application.id,
      candidateName: one(application.crowne_candidates)?.full_name ?? "Candidate",
      employer: one(order.crowne_employers)?.name ?? "Employer",
      jobTitle: order.title,
      country: order.country,
      departureDate: record.departure_date ?? "",
      travelStatus: record.travel_status,
      readiness: record.readiness,
    }];
  });
}

export async function listTransactions(): Promise<FinanceTransaction[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from(crowneTables.transactions)
    .select("id, reference, description, related_record, recorded_on, amount, currency, status, kind");
  fail(error);
  return (data ?? []).flatMap((row) => {
    if (row.currency !== "PHP") return [];
    if (row.kind !== "income" && row.kind !== "expense") return [];
    return [{
      id: row.id,
      reference: row.reference,
      description: row.description,
      relatedRecord: row.related_record ?? "",
      recordedOn: row.recorded_on,
      amountDecimal: Number(row.amount).toFixed(2),
      currency: "PHP" as const,
      status: row.status as FinanceTransaction["status"],
      kind: row.kind,
    }];
  });
}

export async function getDashboard(): Promise<DashboardView> {
  const [orders, applications, transactions, processing, deployments] = await Promise.all([
    listJobOrders(),
    listApplications(),
    listTransactions(),
    listProcessing(),
    listDeployments(),
  ]);
  const incomeCents = transactions
    .filter((transaction) => transaction.kind === "income")
    .reduce((sum, transaction) => sum + centsFromDecimal(transaction.amountDecimal), 0);
  const expenseCents = transactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + centsFromDecimal(transaction.amountDecimal), 0);
  const { count } = await (await client()).from(crowneTables.candidates).select("id", { count: "exact", head: true });
  return {
    illustrative: false,
    fulfillmentNote: FULFILLMENT_NOTE,
    applicants: count ?? 0,
    applications: applications.length,
    shortlisted: applications.filter((application) => application.stage === "Shortlisted").length,
    selected: applications.filter((application) => application.stage === "Selected").length,
    jobOrders: orders.length,
    vacancies: orders.reduce((sum, order) => sum + order.vacancies, 0),
    processing: processing.length,
    readyForDeployment: processing.filter((record) => record.status === "Ready").length,
    deployments: deployments.length,
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
