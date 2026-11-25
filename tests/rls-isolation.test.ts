import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Env = Record<string, string>;

function loadEnv(): Env | null {
  if (!existsSync(".env.local")) return null;
  const env: Env = {};
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, separator)] = value;
  }
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return env;
}

function must<T>(label: string, result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

test("row level security isolates applicants and provisional staff roles", { skip: loadEnv() ? false : "Supabase env is not configured", timeout: 120_000 }, async () => {
  const env = loadEnv();
  assert.ok(env);
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const userIds: string[] = [];
  let employerId = "";
  let jobOrderId = "";
  let publicationId = "";
  let candidateId = "";
  let applicationId = "";
  let financeId = "";
  const objectPaths: string[] = [];

  async function signIn(email: string, password: string) {
    const client = createClient(env!.NEXT_PUBLIC_SUPABASE_URL, env!.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return client;
  }

  async function makeUser(label: string, role: "applicant" | "staff", staffRole: string | null) {
    const email = `crowne.rls.${crypto.randomUUID()}@example.com`;
    const password = `Crowne-Rls-${crypto.randomUUID()}!`;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: label },
    });
    if (created.error || !created.data.user) throw new Error(created.error?.message ?? "The test user could not be created.");
    userIds.push(created.data.user.id);
    must("profile", await admin.from("crowne_profiles").insert({
      id: created.data.user.id,
      full_name: label,
      email,
      role,
      staff_role: staffRole,
    }));
    return { id: created.data.user.id, email, password };
  }

  try {
    const owner = await makeUser("RLS Applicant A", "applicant", null);
    const other = await makeUser("RLS Applicant B", "applicant", null);
    const recruiter = await makeUser("RLS Recruitment", "staff", "recruitment");
    const administrator = await makeUser("RLS Admin", "staff", "admin");
    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();

    employerId = must("employer", await admin.from("crowne_employers").insert({
      name: "RLS Isolation Employer",
      country: "Japan",
      status: "Active",
      contact_name: "",
    }).select("id").single()).id;

    jobOrderId = must("job order", await admin.from("crowne_job_orders").insert({
      reference: `JO-RLS-${suffix}`,
      employer_id: employerId,
      title: "RLS Isolation Role",
      country: "Japan",
      vacancies: 1,
      status: "Recruiting",
      channels: ["Website"],
    }).select("id").single()).id;

    publicationId = must("publication", await admin.from("crowne_job_publications").insert({
      job_order_id: jobOrderId,
      title: "RLS Isolation Role",
      category: "Healthcare",
      employment_type: "Full-time",
      salary_label: "Hidden test listing",
      description: "Isolation test listing.",
      qualifications: [],
      responsibilities: [],
      published: false,
    }).select("id").single()).id;

    candidateId = must("candidate", await admin.from("crowne_candidates").insert({
      profile_id: owner.id,
      reference: `CND-RLS-${suffix}`,
      full_name: "RLS Applicant A",
      email: owner.email,
      status: "Active",
      source: "Agency portal",
    }).select("id").single()).id;

    applicationId = must("application", await admin.from("crowne_applications").insert({
      reference: `APP-RLS-${suffix}`,
      candidate_id: candidateId,
      job_order_id: jobOrderId,
      publication_id: publicationId,
      stage: "New application",
      source: "Agency portal",
    }).select("id").single()).id;

    must("standard document", await admin.from("crowne_candidate_documents").insert({
      candidate_id: candidateId,
      name: "Passport metadata",
      status: "For review",
      sensitivity: "standard",
    }));
    must("medical document", await admin.from("crowne_candidate_documents").insert({
      candidate_id: candidateId,
      name: "Medical metadata",
      status: "For review",
      sensitivity: "medical",
    }));

    financeId = must("finance", await admin.from("crowne_financial_transactions").insert({
      reference: `FIN-RLS-${suffix}`,
      description: "Isolation test",
      related_record: "",
      recorded_on: "2026-11-25",
      amount: 10,
      currency: "PHP",
      status: "Recorded",
      kind: "income",
    }).select("id").single()).id;

    const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const anonProfiles = await anon.from("crowne_profiles").select("id").limit(1);
    assert.ok(anonProfiles.error, "anonymous users can read profiles");

    const publicJobs = must("public jobs", await anon.rpc("crowne_list_public_jobs", { job_id: publicationId }));
    assert.equal(publicJobs.length, 0);

    const intruder = await signIn(other.email, other.password);
    assert.deepEqual(await rows(intruder, "crowne_profiles", "id", owner.id), []);
    assert.deepEqual(await rows(intruder, "crowne_candidates", "id", candidateId), []);
    assert.deepEqual(await rows(intruder, "crowne_applications", "id", applicationId), []);
    assert.deepEqual(await rows(intruder, "crowne_candidate_documents", "candidate_id", candidateId), []);
    assert.deepEqual(await rows(intruder, "crowne_financial_transactions", "id", financeId), []);
    assert.deepEqual(await rows(intruder, "crowne_employers", "id", employerId), []);
    const stolen = await intruder.from("crowne_candidates").update({ full_name: "Stolen" }).eq("id", candidateId).select("id");
    assert.equal(stolen.error, null);
    assert.deepEqual(stolen.data, []);
    const visible = must("visible applications", await intruder.rpc("crowne_visible_applications"));
    assert.equal(visible.some((row) => row.id === applicationId), false);

    const ownerClient = await signIn(owner.email, owner.password);
    assert.deepEqual(await rows(ownerClient, "crowne_candidates", "id", candidateId), [candidateId]);
    const ownDocuments = must("own documents", await ownerClient.from("crowne_candidate_documents").select("sensitivity").eq("candidate_id", candidateId));
    assert.deepEqual(ownDocuments.map((row) => row.sensitivity).sort(), ["medical", "standard"]);

    const bucket = "crowne-candidate-documents";
    const pdf = new TextEncoder().encode("%PDF-1.7\nRLS isolation test\n");
    const standardPath = `${candidateId}/standard/${crypto.randomUUID()}.pdf`;
    const medicalPath = `${candidateId}/medical/${crypto.randomUUID()}.pdf`;
    objectPaths.push(standardPath, medicalPath);
    must("own standard upload", await ownerClient.storage.from(bucket).upload(standardPath, pdf, { contentType: "application/pdf" }));
    must("own medical upload", await ownerClient.storage.from(bucket).upload(medicalPath, pdf, { contentType: "application/pdf" }));
    assert.equal((await ownerClient.storage.from(bucket).download(standardPath)).error, null);
    assert.ok((await ownerClient.storage.from(bucket).download(medicalPath)).error, "an applicant opened a medical file");
    const wrongType = await ownerClient.storage.from(bucket).upload(`${candidateId}/standard/${crypto.randomUUID()}.html`, new TextEncoder().encode("<html>"), { contentType: "text/html" });
    assert.ok(wrongType.error, "the bucket accepted an HTML file");
    assert.ok((await intruder.storage.from(bucket).download(standardPath)).error, "another applicant opened this file");
    const plantedPath = `${candidateId}/standard/${crypto.randomUUID()}.pdf`;
    const planted = await intruder.storage.from(bucket).upload(plantedPath, pdf, { contentType: "application/pdf" });
    if (!planted.error) objectPaths.push(plantedPath);
    assert.ok(planted.error, "another applicant uploaded into this folder");

    const selfVerified = await ownerClient.from("crowne_candidate_documents").insert({
      candidate_id: candidateId,
      name: "Self verified",
      status: "Verified",
      sensitivity: "standard",
      uploaded_by: owner.id,
    });
    assert.ok(selfVerified.error, "an applicant inserted a verified document");
    const medicalRemoved = await ownerClient.from("crowne_candidate_documents").delete().eq("candidate_id", candidateId).eq("sensitivity", "medical").select("id");
    assert.deepEqual(medicalRemoved.data, []);
    const selfRequest = await ownerClient.from("crowne_document_requests").insert({ candidate_id: candidateId, name: "Self request" });
    assert.ok(selfRequest.error, "an applicant created a document request");

    must("own document event", await ownerClient.from("crowne_document_events").insert({ candidate_id: candidateId, action: "uploaded" }));
    assert.deepEqual(await rows(ownerClient, "crowne_document_events", "candidate_id", candidateId), []);
    const forgedEvent = await intruder.from("crowne_document_events").insert({ candidate_id: candidateId, action: "opened" });
    assert.ok(forgedEvent.error, "another applicant wrote to this candidate's document log");
    const ownApplications = must("own applications", await ownerClient.rpc("crowne_visible_applications"));
    assert.equal(ownApplications.some((row) => row.id === applicationId), true);

    const workId = must("own work experience", await ownerClient.from("crowne_candidate_work_experience").insert({
      candidate_id: candidateId,
      job_title: "Caregiver",
      employer_name: "Isolation test",
      start_month: "2023-01-01",
      is_current: true,
    }).select("id").single()).id;
    const educationId = must("own education", await ownerClient.from("crowne_candidate_education").insert({
      candidate_id: candidateId,
      qualification: "Isolation test",
      school: "Isolation test",
      start_month: "2016-06-01",
      end_month: "2020-04-01",
    }).select("id").single()).id;
    const badPeriod = await ownerClient.from("crowne_candidate_work_experience").insert({
      candidate_id: candidateId,
      job_title: "Check",
      employer_name: "Check",
      start_month: "2024-05-01",
      end_month: "2024-01-01",
    });
    assert.ok(badPeriod.error, "an end month before the start month was accepted");
    assert.deepEqual(await rows(intruder, "crowne_candidate_work_experience", "candidate_id", candidateId), []);
    assert.deepEqual(await rows(intruder, "crowne_candidate_education", "candidate_id", candidateId), []);
    const plantedWork = await intruder.from("crowne_candidate_work_experience").insert({
      candidate_id: candidateId,
      job_title: "Planted",
      employer_name: "Planted",
      start_month: "2020-01-01",
      is_current: true,
    });
    assert.ok(plantedWork.error, "another applicant added work experience to this profile");
    const removed = await intruder.from("crowne_candidate_education").delete().eq("id", educationId).select("id");
    assert.deepEqual(removed.data, []);
    assert.deepEqual(await rows(ownerClient, "crowne_candidate_education", "id", educationId), [educationId]);

    const recruitment = await signIn(recruiter.email, recruiter.password);
    assert.deepEqual(await rows(recruitment, "crowne_candidate_work_experience", "id", workId), [workId]);
    assert.deepEqual(await rows(recruitment, "crowne_candidates", "id", candidateId), [candidateId]);
    const recruitmentDocuments = must("recruitment documents", await recruitment.from("crowne_candidate_documents").select("sensitivity").eq("candidate_id", candidateId));
    assert.deepEqual(recruitmentDocuments.map((row) => row.sensitivity).sort(), ["standard"]);
    assert.equal((await recruitment.storage.from(bucket).download(standardPath)).error, null);
    assert.ok((await recruitment.storage.from(bucket).download(medicalPath)).error, "recruitment opened a medical file");
    const requestId = must("staff request", await recruitment.from("crowne_document_requests").insert({ candidate_id: candidateId, name: "Passport", requested_by: recruiter.id }).select("id").single()).id;
    assert.deepEqual(await rows(ownerClient, "crowne_document_requests", "candidate_id", candidateId), [requestId]);
    assert.deepEqual(await rows(intruder, "crowne_document_requests", "candidate_id", candidateId), []);
    const reviewed = must("standard review", await recruitment.from("crowne_candidate_documents").update({ status: "Verified" }).eq("candidate_id", candidateId).eq("sensitivity", "standard").select("id"));
    assert.equal(reviewed.length, 1);
    const medicalReview = must("medical review", await recruitment.from("crowne_candidate_documents").update({ status: "Verified" }).eq("candidate_id", candidateId).eq("sensitivity", "medical").select("id"));
    assert.deepEqual(medicalReview, []);
    assert.equal((await rows(recruitment, "crowne_document_events", "candidate_id", candidateId)).length, 1);
    assert.deepEqual(await rows(recruitment, "crowne_financial_transactions", "id", financeId), []);

    const adminStaff = await signIn(administrator.email, administrator.password);
    const medical = must("admin documents", await adminStaff.from("crowne_candidate_documents").select("sensitivity").eq("candidate_id", candidateId));
    assert.deepEqual(medical.map((row) => row.sensitivity).sort(), ["medical", "standard"]);
    assert.equal((await adminStaff.storage.from(bucket).download(medicalPath)).error, null);
    assert.deepEqual(await rows(adminStaff, "crowne_financial_transactions", "id", financeId), [financeId]);
  } finally {
    if (objectPaths.length) await admin.storage.from("crowne-candidate-documents").remove(objectPaths);
    if (applicationId) {
      await admin.from("crowne_application_status_history").delete().eq("application_id", applicationId);
      await admin.from("crowne_applications").delete().eq("id", applicationId);
    }
    if (candidateId) {
      await admin.from("crowne_candidate_documents").delete().eq("candidate_id", candidateId);
      await admin.from("crowne_candidates").delete().eq("id", candidateId);
    }
    if (publicationId) await admin.from("crowne_job_publications").delete().eq("id", publicationId);
    if (jobOrderId) await admin.from("crowne_job_orders").delete().eq("id", jobOrderId);
    if (employerId) await admin.from("crowne_employers").delete().eq("id", employerId);
    if (financeId) await admin.from("crowne_financial_transactions").delete().eq("id", financeId);
    for (const userId of userIds) await admin.auth.admin.deleteUser(userId);
  }
});

async function rows(client: SupabaseClient, table: string, column: string, value: string) {
  const { data, error } = await client.from(table).select("id").eq(column, value);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.id as string);
}
