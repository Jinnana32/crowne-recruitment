import { getDataSource } from "@/lib/data/source";
import * as demo from "@/lib/data/demo-store";
import * as live from "@/lib/data/live-store";
import { DataUnavailableError } from "@/lib/data/errors";
import type { ApplicationStage } from "@/lib/domain/stages";
import type { Candidate, ChecklistItem, DeploymentRecord } from "@/lib/data/types";
import type { DocumentActor, DocumentUpload } from "@/lib/data/document-store";
import type { DocumentStatus } from "@/lib/domain/documents";
import type { DocumentRequestInput, EducationInput, WorkExperienceInput } from "@/lib/validation/api";

export { DataUnavailableError };

function liveSource() {
  return getDataSource() === "supabase";
}

export async function listPublicJobs(filters: { query?: string; country?: string; category?: string }) {
  return liveSource() ? live.listPublicJobs(filters) : demo.listPublicJobs(filters);
}

export async function getPublicJob(id: string) {
  return liveSource() ? live.getPublicJob(id) : demo.getPublicJob(id);
}

export async function listJobOrders() {
  return liveSource() ? live.listJobOrders() : demo.listJobOrders();
}

export async function listEmployers() {
  return liveSource() ? live.listEmployers() : demo.listEmployers();
}

export async function listApplications() {
  return liveSource() ? live.listApplications() : demo.listApplications();
}

export async function listCandidates() {
  return liveSource() ? live.listCandidates() : demo.listCandidates();
}

export async function getCandidate(candidateId: string) {
  const candidates = await listCandidates();
  return candidates.find((candidate) => candidate.id === candidateId) ?? null;
}

export async function listProcessing() {
  return liveSource() ? live.listProcessing() : demo.listProcessing();
}

export async function updateChecklistItem(processingId: string, label: string, state: ChecklistItem["state"]) {
  return liveSource()
    ? live.updateChecklistItem(processingId, label, state)
    : demo.updateChecklistItem(processingId, label, state);
}

export async function markProcessingReady(processingId: string) {
  return liveSource() ? live.markProcessingReady(processingId) : demo.markProcessingReady(processingId);
}

export async function createDeploymentFromProcessing(processingId: string, departureDate: string) {
  return liveSource()
    ? live.createDeploymentFromProcessing(processingId, departureDate)
    : demo.createDeploymentFromProcessing(processingId, departureDate);
}

export async function updateDeployment(
  deploymentId: string,
  patch: { travelStatus?: DeploymentRecord["travelStatus"]; readiness?: DeploymentRecord["readiness"] },
) {
  return liveSource() ? live.updateDeployment(deploymentId, patch) : demo.updateDeployment(deploymentId, patch);
}

export async function listDeployments() {
  return liveSource() ? live.listDeployments() : demo.listDeployments();
}

export async function listTransactions() {
  return liveSource() ? live.listTransactions() : demo.listTransactions();
}

export async function getDashboard() {
  return liveSource() ? live.getDashboard() : demo.getDashboard();
}

export async function listDocuments(candidateId: string) {
  return liveSource() ? live.listDocuments(candidateId) : demo.listDocuments(candidateId);
}

export async function uploadDocument(input: DocumentUpload) {
  return liveSource() ? live.uploadDocument(input) : demo.uploadDocument(input);
}

export async function deleteDocument(candidateId: string, documentId: string) {
  return liveSource() ? live.deleteDocument(candidateId, documentId) : demo.deleteDocument(candidateId, documentId);
}

export async function openDocument(documentId: string, actor: DocumentActor) {
  return liveSource() ? live.openDocument(documentId, actor) : demo.openDocument(documentId, actor);
}

export async function reviewDocument(documentId: string, status: DocumentStatus) {
  return liveSource() ? live.reviewDocument(documentId, status) : demo.reviewDocument(documentId, status);
}

export async function createDocumentRequest(candidateId: string, input: DocumentRequestInput, actorId: string | null) {
  return liveSource() ? live.createDocumentRequest(candidateId, input, actorId) : demo.createDocumentRequest(candidateId, input);
}

export async function deleteDocumentRequest(candidateId: string, requestId: string) {
  return liveSource() ? live.deleteDocumentRequest(candidateId, requestId) : demo.deleteDocumentRequest(candidateId, requestId);
}

export async function createApplication(input: { candidateId: string; publicationId: string }) {
  return liveSource() ? live.createApplication(input) : demo.createApplication(input);
}

export async function updateApplicationStage(id: string, stage: ApplicationStage) {
  return liveSource() ? live.updateApplicationStage(id, stage) : demo.updateApplicationStage(id, stage);
}

export async function listApplicationHistory(applicationId: string) {
  return liveSource() ? live.listApplicationHistory(applicationId) : demo.listApplicationHistory(applicationId);
}

export async function updateCandidate(candidateId: string, patch: Partial<Candidate>) {
  return liveSource() ? live.updateCandidate(candidateId, patch) : demo.updateCandidate(candidateId, patch);
}

export async function listWorkExperience(candidateId: string) {
  return liveSource() ? live.listWorkExperience(candidateId) : demo.listWorkExperience(candidateId);
}

export async function saveWorkExperience(candidateId: string, input: WorkExperienceInput, entryId?: string) {
  return liveSource() ? live.saveWorkExperience(candidateId, input, entryId) : demo.saveWorkExperience(candidateId, input, entryId);
}

export async function deleteWorkExperience(candidateId: string, entryId: string) {
  return liveSource() ? live.deleteWorkExperience(candidateId, entryId) : demo.deleteWorkExperience(candidateId, entryId);
}

export async function listEducation(candidateId: string) {
  return liveSource() ? live.listEducation(candidateId) : demo.listEducation(candidateId);
}

export async function saveEducation(candidateId: string, input: EducationInput, entryId?: string) {
  return liveSource() ? live.saveEducation(candidateId, input, entryId) : demo.saveEducation(candidateId, input, entryId);
}

export async function deleteEducation(candidateId: string, entryId: string) {
  return liveSource() ? live.deleteEducation(candidateId, entryId) : demo.deleteEducation(candidateId, entryId);
}

export async function importCandidates(rows: Array<{ fullName: string; email: string; source: Candidate["source"] }>) {
  return liveSource() ? live.importCandidates(rows) : demo.importCandidates(rows);
}

export async function createJobOpening(input: {
  employerName: string;
  country: string;
  title: string;
  vacancies: number;
  category: string;
  employmentType: string;
  salaryLabel: string;
  description: string;
}) {
  if (!liveSource()) {
    throw new DataUnavailableError("Publishing a live job requires the Supabase project.");
  }
  return live.createJobOpening(input);
}

export async function updateJobOrder(id: string, input: demo.JobOrderEdit) {
  return liveSource() ? live.updateJobOrder(id, input) : demo.updateJobOrder(id, input);
}

export async function ensureDemoCandidate(input: { fullName: string; email: string }) {
  if (liveSource()) {
    throw new DataUnavailableError("Demo accounts are unavailable when Supabase is configured.");
  }
  return demo.ensureDemoCandidate(input);
}
