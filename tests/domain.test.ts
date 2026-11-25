import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createDeploymentFromProcessing,
  createDocumentRequest,
  deleteDocument,
  listDeployments,
  listDocuments,
  listProcessing,
  listTransactions,
  markProcessingReady,
  openDocument,
  updateApplicationStage,
  updateChecklistItem,
  uploadDocument,
  deleteWorkExperience,
  listCandidates,
  listJobOrders,
  listPublicJobs,
  listWorkExperience,
  saveWorkExperience,
  updateJobOrder,
} from "../src/lib/data/demo-store.ts";
import { contentDisposition, detectDocumentType, displayNameFromFilename, documentStoragePath, downloadFilename, requestState } from "../src/lib/domain/documents.ts";
import { activeApplicationCount, applicantTrackIndex, emptyProfileFields, stageProgress } from "../src/features/applicant/applicant-state.ts";
import { educationSchema, sessionSchema, workExperienceSchema } from "../src/lib/validation/api.ts";
import { profileCompleteness } from "../src/lib/domain/profile.ts";
import { centsFromDecimal, decimalFromCents } from "../src/lib/domain/money.ts";
import { isMiddleEastCountry, MIDDLE_EAST_COUNTRIES } from "../src/lib/domain/countries.ts";
import { isChecklistComplete, nextChecklistState } from "../src/lib/domain/processing.ts";
import { fulfillmentPercent, isApplicationStage } from "../src/lib/domain/stages.ts";
import { createSeedCatalog } from "../src/lib/data/seed.ts";
import { cvFilename, renderAtsCvHtml } from "../src/lib/cv/ats-template.ts";
import type { CandidateView } from "../src/lib/data/demo-store.ts";

test("one candidate can hold two applications with different stages", () => {
  const catalog = createSeedCatalog();
  const applications = catalog.applications.filter((application) => application.candidateId === "cand-maria");
  assert.equal(applications.length, 2);
  assert.notEqual(applications[0]?.stage, applications[1]?.stage);
});

test("unpublished jobs stay out of the public publication flag", () => {
  const catalog = createSeedCatalog();
  const draft = catalog.publications.find((publication) => publication.title === "Cook");
  assert.equal(draft?.published, false);
  assert.ok(catalog.publications.some((publication) => publication.published));
});

test("processing records point only at selected applications", () => {
  const catalog = createSeedCatalog();
  for (const record of catalog.processing) {
    const application = catalog.applications.find((item) => item.id === record.applicationId);
    assert.equal(application?.stage, "Selected");
  }
});

test("demo destinations stay in the Middle East list", () => {
  const catalog = createSeedCatalog();
  for (const order of catalog.jobOrders) assert.equal(isMiddleEastCountry(order.country), true);
  for (const employer of catalog.employers) assert.equal(isMiddleEastCountry(employer.country), true);
  assert.equal(MIDDLE_EAST_COUNTRIES.includes("Japan" as never), false);
});

test("selected applications open processing and can reach deployment with finance posts", () => {
  assert.equal(nextChecklistState("Passport verification", "Pending"), "Done");
  assert.equal(nextChecklistState("Medical examination", "Pending"), "Passed");
  updateApplicationStage("app-1018", "Selected");
  const opened = listProcessing().find((item) => item.applicationId === "app-1018");
  assert.ok(opened);
  assert.equal(opened.status, "In progress");
  assert.equal(isChecklistComplete(opened.checklist), false);

  for (const item of opened.checklist) {
    const next = nextChecklistState(item.label, "Pending");
    const updated = updateChecklistItem(opened.id, item.label, next);
    assert.equal(updated.ok, true);
  }
  const beforeReady = listTransactions().length;
  const ready = markProcessingReady(opened.id);
  assert.equal(ready.ok, true);
  if (!ready.ok) return;
  assert.equal(ready.record.status, "Ready");
  assert.ok(listTransactions().length >= beforeReady);

  const scheduled = createDeploymentFromProcessing(opened.id, "2026-12-15");
  assert.equal(scheduled.ok, true);
  assert.ok(listDeployments().some((item) => item.applicationId === "app-1018"));
  assert.ok(listTransactions().some((item) => item.description === "Employer placement fee"));
});

test("money stays in decimal cents", () => {
  assert.equal(centsFromDecimal("180000.00"), 18000000);
  assert.equal(centsFromDecimal("-4500.50"), -450050);
  assert.equal(decimalFromCents(18000000), "180000.00");
});

test("unknown stages are rejected", () => {
  assert.equal(isApplicationStage("Selected"), true);
  assert.equal(isApplicationStage("Hired"), false);
  assert.equal(fulfillmentPercent(1, 25), 4);
});

test("every migrated table is prefixed and enables row level security", () => {
  const sql = readFileSync("supabase/migrations/20261125140000_initial_baseline.sql", "utf8");
  const tables = [...sql.matchAll(/create table if not exists public\.(\w+)/g)].map((match) => match[1]);
  assert.ok(tables.length >= 10);
  for (const table of tables) {
    assert.match(table, /^crowne_/);
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(sql, /function public\.crowne_is_staff\(\)/);
  assert.doesNotMatch(sql, /grant [^;]+ on all tables in schema public/i);
  const accounts = readFileSync("supabase/migrations/20261125183000_accounts_and_public_jobs.sql", "utf8");
  assert.match(accounts, /role = 'applicant'/);
  assert.match(accounts, /function public\.crowne_list_public_jobs/);
  assert.match(accounts, /published = true/);
});

test("applicant next actions come from empty profile fields", () => {
  const missing = emptyProfileFields({
    fullName: "Elena Ramos",
    mobile: "",
    preferredRole: "Caregiver",
    languages: "English",
    preferredDestination: "Saudi Arabia",
    dateOfBirth: "1992-03-10",
    nationality: "Filipino",
    workExperienceCount: 2,
    educationCount: 0,
  });
  assert.deepEqual(missing.map((field) => field.key), ["mobile", "education"]);
  assert.equal(activeApplicationCount(["Screening", "Rejected", "Withdrawn"]), 1);
  assert.equal(stageProgress("Screening")?.index, 1);
  assert.equal(stageProgress("Rejected"), null);
  assert.equal(applicantTrackIndex("Screening"), 1);
  assert.equal(applicantTrackIndex("Employer review"), 2);
  assert.equal(applicantTrackIndex("Rejected"), null);
});

test("work and education entries need a valid period", () => {
  const work = { jobTitle: "Caregiver", employerName: "Harbor Care Center", startMonth: "2023-01" };
  assert.equal(workExperienceSchema.safeParse({ ...work, isCurrent: true }).success, true);
  assert.equal(workExperienceSchema.safeParse({ ...work, isCurrent: false }).success, false);
  assert.equal(workExperienceSchema.safeParse({ ...work, endMonth: "2022-12" }).success, false);
  assert.equal(workExperienceSchema.safeParse({ ...work, startMonth: "2023-13", isCurrent: true }).success, false);
  const school = { qualification: "Bachelor's Degree", school: "University of the Philippines", startMonth: "2016-06" };
  assert.equal(educationSchema.safeParse({ ...school, endMonth: "2020-04" }).success, true);
  assert.equal(educationSchema.safeParse({ ...school, school: "" , endMonth: "2020-04" }).success, false);
});

test("completion counts entries, not the earlier single-line notes", () => {
  const filled = { fullName: "A", mobile: "1", dateOfBirth: "1992-03-10", nationality: "Filipino", preferredRole: "Caregiver", languages: "English", preferredDestination: "Japan" };
  assert.equal(profileCompleteness(filled, { workExperienceCount: 0, educationCount: 0 }), 78);
  assert.equal(profileCompleteness(filled, { workExperienceCount: 2, educationCount: 1 }), 100);
});

test("demo work experience is scoped to its candidate", () => {
  const entry = saveWorkExperience("cand-maria", { jobTitle: "Caregiver", employerName: "Harbor Care Center", country: "Japan", startMonth: "2023-01", isCurrent: true, description: "" });
  assert.ok(entry);
  assert.equal(entry.endMonth, "");
  assert.equal(saveWorkExperience("cand-roberto", { jobTitle: "x", employerName: "x", country: "", startMonth: "2023-01", isCurrent: true, description: "" }, entry.id), null);
  assert.equal(deleteWorkExperience("cand-roberto", entry.id), false);
  assert.equal(listCandidates().find((candidate) => candidate.id === "cand-maria")?.workExperienceCount, 1);
  assert.equal(deleteWorkExperience("cand-maria", entry.id), true);
  assert.deepEqual(listWorkExperience("cand-maria"), []);
});

test("login accepts an email and password without a name", () => {
  const parsed = sessionSchema.safeParse({
    mode: "login",
    email: "crowne.staff@example.com",
    name: "",
    password: "Crowne-Staff-2026!",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.name, undefined);
});

test("editing a job order updates its listing and can hide it", () => {
  const original = listJobOrders().find((order) => order.id === "jo-031");
  assert.ok(original);
  const hidden = updateJobOrder("jo-031", {
    title: "Caregiver",
    country: "Japan",
    vacancies: 12,
    category: original.category,
    employmentType: original.employmentType,
    salaryLabel: original.salaryLabel,
    description: original.description,
    published: false,
  });
  assert.equal(hidden?.vacancies, 12);
  assert.equal(hidden?.published, false);
  assert.equal(listPublicJobs({}).some((job) => job.jobOrderReference === original.reference), false);
  const restored = updateJobOrder("jo-031", {
    title: original.title,
    country: original.country,
    vacancies: original.vacancies,
    category: original.category,
    employmentType: original.employmentType,
    salaryLabel: original.salaryLabel,
    description: original.description,
    published: true,
  });
  assert.equal(restored?.published, true);
  assert.equal(restored?.vacancies, original.vacancies);
});

test("ATS CV HTML stays single-column and escapes profile text", () => {
  const candidate = {
    id: "cand-1",
    reference: "CND-1",
    fullName: "Elena Ramos",
    email: "elena@example.com",
    status: "Active",
    source: "Agency portal",
    mobile: "0917",
    dateOfBirth: "",
    nationality: "Filipino",
    preferredRole: "Caregiver",
    experience: "Support <daily> care & mobility.",
    education: "",
    languages: "English, Filipino",
    preferredDestination: "Japan",
    latestApplication: "Caregiver · Japan",
    applicationCount: 1,
    profileCompleteness: 80,
    workExperienceCount: 1,
    educationCount: 0,
  } satisfies CandidateView;

  const html = renderAtsCvHtml({
    candidate,
    workExperience: [
      {
        id: "w1",
        candidateId: "cand-1",
        jobTitle: "Caregiver",
        employerName: "Harbor Care",
        country: "Japan",
        startMonth: "2022-01",
        endMonth: "",
        isCurrent: true,
        description: "Daily care",
      },
    ],
    education: [],
  });

  assert.match(html, /<h1>Elena Ramos<\/h1>/);
  assert.match(html, /Support &lt;daily&gt; care &amp; mobility\./);
  assert.match(html, /Work experience/);
  assert.doesNotMatch(html, /display:\s*grid|column-count|float:\s*left/);
  assert.equal(cvFilename('Elena / Ramos "file"'), "Elena_Ramos_file_CV.pdf");
});

test("document uploads are typed by file signature, not by name", () => {
  const pdf = new TextEncoder().encode("%PDF-1.7\n");
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  assert.equal(detectDocumentType(pdf), "application/pdf");
  assert.equal(detectDocumentType(png), "image/png");
  assert.equal(detectDocumentType(jpeg), "image/jpeg");
  assert.equal(detectDocumentType(new TextEncoder().encode("<html><script>")), null);
  assert.equal(detectDocumentType(new Uint8Array()), null);
  assert.equal(displayNameFromFilename("nbi_clearance  2026.pdf"), "nbi clearance 2026");
  assert.equal(displayNameFromFilename(".pdf"), "Document");
  assert.equal(downloadFilename('Pass/port "copy"', "application/pdf"), "Passport copy.pdf");
  assert.match(contentDisposition("Pasaporte ñ.pdf", false), /^attachment; filename="Pasaporte _\.pdf"; filename\*=UTF-8''Pasaporte%20%C3%B1\.pdf$/);
  assert.match(documentStoragePath("cand-1", "medical", "image/png"), /^cand-1\/medical\/[0-9a-f-]{36}\.png$/);
});

test("a document request takes the state of its newest file", () => {
  const files = [
    { id: "a", requestId: "r1", status: "Verified" as const, uploadedAt: "2026-11-20T00:00:00Z" },
    { id: "b", requestId: "r1", status: "For review" as const, uploadedAt: "2026-11-24T00:00:00Z" },
  ];
  assert.deepEqual(requestState("r1", files), { state: "For review", documentId: "b" });
  assert.deepEqual(requestState("r2", files), { state: "Required", documentId: null });
});

test("demo documents stay scoped to their candidate and keep medical files closed to applicants", () => {
  const bytes = new TextEncoder().encode("%PDF-1.7\n");
  const request = createDocumentRequest("cand-roberto", { name: "Medical certificate", description: "", sensitivity: "medical" });
  assert.ok(request);
  assert.deepEqual(uploadDocument({ candidateId: "cand-maria", actorId: null, name: "", requestId: request.id, originalFilename: "x.pdf", mime: "application/pdf", bytes }), { ok: false, reason: "request_not_found" });
  const medical = uploadDocument({ candidateId: "cand-roberto", actorId: null, name: "", requestId: request.id, originalFilename: "medical.pdf", mime: "application/pdf", bytes });
  assert.ok(medical.ok);
  assert.equal(medical.document.sensitivity, "medical");
  assert.equal(medical.document.name, "Medical certificate");
  assert.equal(listDocuments("cand-roberto").requests.find((item) => item.id === request.id)?.state, "For review");
  assert.deepEqual(openDocument(medical.document.id, { role: "applicant", candidateId: "cand-roberto" }), { kind: "restricted" });
  assert.equal(deleteDocument("cand-roberto", medical.document.id), "locked");

  const resume = uploadDocument({ candidateId: "cand-roberto", actorId: null, name: "", requestId: null, originalFilename: "my_resume.pdf", mime: "application/pdf", bytes });
  assert.ok(resume.ok);
  assert.equal(resume.document.name, "my resume");
  assert.deepEqual(openDocument(resume.document.id, { role: "applicant", candidateId: "cand-maria" }), { kind: "not_found" });
  assert.equal(openDocument(resume.document.id, { role: "applicant", candidateId: "cand-roberto" }).kind, "file");
  assert.equal(deleteDocument("cand-maria", resume.document.id), "not_found");
  assert.equal(deleteDocument("cand-roberto", resume.document.id), "deleted");
  assert.equal(listDocuments("cand-maria").documents.some((item) => item.candidateId !== "cand-maria"), false);
});
