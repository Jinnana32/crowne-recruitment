/**
 * Seeds illustrative agency data into the live Supabase project for demos.
 *
 * Creates ~20 published Middle East job listings and 10 applicants with
 * applications spread across recruitment stages. Not production Crowne data.
 *
 * Usage:
 *   node scripts/scaffold-demo-data.mjs
 *   node scripts/scaffold-demo-data.mjs --force   # remove prior scaffold rows first
 *
 * Applicant password for all scaffold accounts: Applicant-Demo-2026!
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

function envValue(name) {
  if (process.env[name]) return process.env[name];
  const file = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of file.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    if (key === name) return rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

const force = process.argv.includes("--force");
const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
const key = envValue("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local.");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const PASSWORD = "Applicant-Demo-2026!";
const MARKER = "Scaffold Seed";
const EMAIL_PREFIX = "scaffold.applicant";

const COUNTRIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
];

const JOBS = [
  { title: "Welder", category: "Construction", employer: "Al Noor Industrial Co.", country: "Qatar", vacancies: 40, salary: "QAR 1,800–2,200" },
  { title: "Electrician", category: "Engineering", employer: "Gulf Build LLC", country: "United Arab Emirates", vacancies: 25, salary: "AED 1,600–2,000" },
  { title: "Caregiver", category: "Healthcare", employer: "Riyadh Care Partners", country: "Saudi Arabia", vacancies: 30, salary: "SAR 1,800–2,200" },
  { title: "Heavy Equipment Operator", category: "Construction", employer: "Desert Works Contracting", country: "Saudi Arabia", vacancies: 18, salary: "SAR 2,000–2,500" },
  { title: "Hotel Staff", category: "Hospitality", employer: "Kuwait Hospitality Group", country: "Kuwait", vacancies: 22, salary: "KWD 180–220" },
  { title: "Cook", category: "Hospitality", employer: "Bahrain Culinary Services", country: "Bahrain", vacancies: 12, salary: "BHD 180–220" },
  { title: "Pipe Fitter", category: "Construction", employer: "Muscat Industrial Partners", country: "Oman", vacancies: 15, salary: "OMR 220–280" },
  { title: "Nurse Assistant", category: "Healthcare", employer: "Abu Dhabi Care Network", country: "United Arab Emirates", vacancies: 20, salary: "AED 2,000–2,400" },
  { title: "Driver", category: "Logistics", employer: "Qatar Fleet Services", country: "Qatar", vacancies: 35, salary: "QAR 1,500–1,900" },
  { title: "Mason", category: "Construction", employer: "Al Noor Industrial Co.", country: "Qatar", vacancies: 28, salary: "QAR 1,600–2,000" },
  { title: "Plumber", category: "Engineering", employer: "Gulf Build LLC", country: "United Arab Emirates", vacancies: 16, salary: "AED 1,500–1,900" },
  { title: "Housekeeping Attendant", category: "Hospitality", employer: "Kuwait Hospitality Group", country: "Kuwait", vacancies: 24, salary: "KWD 150–190" },
  { title: "Warehouse Helper", category: "Logistics", employer: "Jeddah Supply Hub", country: "Saudi Arabia", vacancies: 40, salary: "SAR 1,400–1,800" },
  { title: "AC Technician", category: "Engineering", employer: "Gulf Build LLC", country: "United Arab Emirates", vacancies: 14, salary: "AED 1,800–2,200" },
  { title: "Waiter", category: "Hospitality", employer: "Bahrain Culinary Services", country: "Bahrain", vacancies: 18, salary: "BHD 160–200" },
  { title: "Steel Fixer", category: "Construction", employer: "Desert Works Contracting", country: "Saudi Arabia", vacancies: 26, salary: "SAR 1,700–2,100" },
  { title: "Security Guard", category: "Facilities", employer: "Muscat Industrial Partners", country: "Oman", vacancies: 20, salary: "OMR 180–220" },
  { title: "Kitchen Helper", category: "Hospitality", employer: "Kuwait Hospitality Group", country: "Kuwait", vacancies: 15, salary: "KWD 140–180" },
  { title: "Scaffolding Erector", category: "Construction", employer: "Al Noor Industrial Co.", country: "Qatar", vacancies: 22, salary: "QAR 1,700–2,100" },
  { title: "Caregiver", category: "Healthcare", employer: "Abu Dhabi Care Network", country: "United Arab Emirates", vacancies: 18, salary: "AED 1,900–2,300" },
];

const APPLICANTS = [
  { name: "Maria Santos", email: `${EMAIL_PREFIX}01@example.com`, role: "Caregiver", destination: "Saudi Arabia", stage: "New application" },
  { name: "Roberto Lim", email: `${EMAIL_PREFIX}02@example.com`, role: "Electrician", destination: "United Arab Emirates", stage: "New application" },
  { name: "Paolo Garcia", email: `${EMAIL_PREFIX}03@example.com`, role: "Welder", destination: "Qatar", stage: "Screening" },
  { name: "Jose Mendoza", email: `${EMAIL_PREFIX}04@example.com`, role: "Welder", destination: "Qatar", stage: "Screening" },
  { name: "Liza Flores", email: `${EMAIL_PREFIX}05@example.com`, role: "Caregiver", destination: "United Arab Emirates", stage: "Shortlisted" },
  { name: "Ramon Cruz", email: `${EMAIL_PREFIX}06@example.com`, role: "Pipe Fitter", destination: "Oman", stage: "Shortlisted" },
  { name: "Ana Bautista", email: `${EMAIL_PREFIX}07@example.com`, role: "Electrician", destination: "United Arab Emirates", stage: "Employer review" },
  { name: "Carlo Reyes", email: `${EMAIL_PREFIX}08@example.com`, role: "Driver", destination: "Qatar", stage: "Employer review" },
  { name: "Mark Villanueva", email: `${EMAIL_PREFIX}09@example.com`, role: "Heavy Equipment Operator", destination: "Saudi Arabia", stage: "Selected" },
  { name: "Elena Ramos", email: `${EMAIL_PREFIX}10@example.com`, role: "Caregiver", destination: "Kuwait", stage: "Selected" },
];

const CHECKLIST = [
  { label: "Passport verification", state: "Pending", sensitivity: "standard" },
  { label: "Police clearance", state: "Pending", sensitivity: "standard" },
  { label: "Medical examination", state: "Pending", sensitivity: "medical" },
  { label: "Employment contract", state: "Pending", sensitivity: "standard" },
  { label: "Pre-departure orientation", state: "Pending", sensitivity: "standard" },
];

function ref(prefix) {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix}-${day}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function fail(error, label) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

async function findAuthUserId(email) {
  for (let page = 1; page <= 30; page += 1) {
    const listed = await admin.auth.admin.listUsers({ page, perPage: 200 });
    fail(listed.error, "listUsers");
    const found = listed.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (listed.data.users.length < 200) break;
  }
  return null;
}

async function ensureAuthUser({ email, name }) {
  let userId = await findAuthUserId(email);
  if (userId) {
    const updated = await admin.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: name, scaffold: true },
    });
    fail(updated.error, `updateUser ${email}`);
    return userId;
  }
  const created = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name, scaffold: true },
  });
  fail(created.error, `createUser ${email}`);
  return created.data.user.id;
}

async function clearScaffold() {
  const { data: candidates, error: candError } = await admin
    .from("crowne_candidates")
    .select("id, profile_id, email")
    .like("email", `${EMAIL_PREFIX}%`);
  fail(candError, "list scaffold candidates");

  const candidateIds = (candidates ?? []).map((row) => row.id);
  if (candidateIds.length) {
    const { data: apps, error: appsError } = await admin
      .from("crowne_applications")
      .select("id")
      .in("candidate_id", candidateIds);
    fail(appsError, "list scaffold applications");
    const appIds = (apps ?? []).map((row) => row.id);
    if (appIds.length) {
      const { data: processingRows, error: processingError } = await admin
        .from("crowne_processing_records")
        .select("id")
        .in("application_id", appIds);
      fail(processingError, "list scaffold processing");
      const processingIds = (processingRows ?? []).map((row) => row.id);
      if (processingIds.length) {
        await admin.from("crowne_processing_checklist_items").delete().in("processing_record_id", processingIds);
        await admin.from("crowne_processing_records").delete().in("id", processingIds);
      }
      await admin.from("crowne_deployment_records").delete().in("application_id", appIds);
      await admin.from("crowne_application_status_history").delete().in("application_id", appIds);
      await admin.from("crowne_applications").delete().in("id", appIds);
    }
    await admin.from("crowne_candidates").delete().in("id", candidateIds);
  }

  for (const row of candidates ?? []) {
    if (row.profile_id) await admin.from("crowne_profiles").delete().eq("id", row.profile_id);
  }

  const { data: employers, error: empError } = await admin
    .from("crowne_employers")
    .select("id")
    .eq("contact_name", MARKER);
  fail(empError, "list scaffold employers");
  const employerIds = (employers ?? []).map((row) => row.id);
  if (employerIds.length) {
    const { data: orders, error: orderError } = await admin
      .from("crowne_job_orders")
      .select("id")
      .in("employer_id", employerIds);
    fail(orderError, "list scaffold job orders");
    const orderIds = (orders ?? []).map((row) => row.id);
    if (orderIds.length) {
      await admin.from("crowne_job_publications").delete().in("job_order_id", orderIds);
      await admin.from("crowne_job_orders").delete().in("id", orderIds);
    }
    await admin.from("crowne_employers").delete().in("id", employerIds);
  }

  console.log("Cleared prior scaffold employers, jobs, applicants, and applications.");
}

async function seedJobs() {
  const { data: existing } = await admin
    .from("crowne_employers")
    .select("id")
    .eq("contact_name", MARKER)
    .limit(1);
  if ((existing ?? []).length && !force) {
    throw new Error("Scaffold jobs already exist. Re-run with --force to replace them.");
  }

  const employerIds = new Map();
  const publications = [];

  for (const job of JOBS) {
    let employerId = employerIds.get(job.employer);
    if (!employerId) {
      const inserted = await admin
        .from("crowne_employers")
        .insert({
          name: job.employer,
          country: job.country,
          status: "Active",
          contact_name: MARKER,
        })
        .select("id")
        .single();
      fail(inserted.error, `employer ${job.employer}`);
      employerId = inserted.data.id;
      employerIds.set(job.employer, employerId);
    }

    const order = await admin
      .from("crowne_job_orders")
      .insert({
        reference: ref("JO"),
        employer_id: employerId,
        title: job.title,
        country: job.country,
        vacancies: job.vacancies,
        status: "Recruiting",
        channels: ["Website"],
      })
      .select("id")
      .single();
    fail(order.error, `job order ${job.title}`);

    const publication = await admin
      .from("crowne_job_publications")
      .insert({
        job_order_id: order.data.id,
        title: job.title,
        category: job.category,
        employment_type: "Full-time",
        salary_label: job.salary,
        description: `${job.title} opening with ${job.employer} in ${job.country}. Scaffold demo listing for Crowne ORMS walkthroughs.`,
        qualifications: [
          "Relevant work experience in the position.",
          "Ability to follow workplace safety procedures.",
          "Valid passport or willingness to process required travel documents.",
        ],
        responsibilities: [
          "Carry out assigned duties based on the employer's requirements.",
          "Maintain safe and professional working practices.",
          "Coordinate with supervisors and the assigned team.",
        ],
        published: true,
      })
      .select("id, job_order_id, title")
      .single();
    fail(publication.error, `publication ${job.title}`);
    publications.push({
      id: publication.data.id,
      jobOrderId: publication.data.job_order_id,
      title: publication.data.title,
      country: job.country,
    });
  }

  console.log(`Created ${employerIds.size} employers and ${publications.length} published jobs.`);
  return publications;
}

function pickPublication(publications, preferredRole, preferredCountry, index) {
  const preferred = publications.filter(
    (item) => item.title === preferredRole || item.country === preferredCountry,
  );
  if (preferred.length) return preferred[index % preferred.length];
  return publications[index % publications.length];
}

function checklistForStage(stage, index) {
  if (stage !== "Selected") return null;
  if (index % 2 === 0) {
    return CHECKLIST.map((item, itemIndex) => ({
      ...item,
      state: itemIndex < 3 ? (item.label === "Medical examination" ? "Passed" : "Done") : "Pending",
    }));
  }
  return CHECKLIST.map((item) => ({ ...item }));
}

async function seedApplicants(publications) {
  const created = [];
  for (const [index, person] of APPLICANTS.entries()) {
    const userId = await ensureAuthUser(person);
    const profile = await admin.from("crowne_profiles").upsert({
      id: userId,
      full_name: person.name,
      email: person.email,
      role: "applicant",
    });
    fail(profile.error, `profile ${person.email}`);

    const { data: existingCandidate } = await admin
      .from("crowne_candidates")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();

    let candidateId = existingCandidate?.id ?? null;
    if (!candidateId) {
      const inserted = await admin
        .from("crowne_candidates")
        .insert({
          profile_id: userId,
          reference: ref("CND"),
          full_name: person.name,
          email: person.email,
          status: person.stage === "Selected" ? "For processing" : "Active",
          source: "Agency portal",
          mobile: `+63 917 55${String(10000 + index).slice(-5)}`,
          date_of_birth: `199${index % 10}-0${(index % 8) + 1}-15`,
          nationality: "Filipino",
          preferred_role: person.role,
          languages: "English, Filipino",
          preferred_destination: person.destination,
          experience: `${3 + (index % 8)} years`,
          education: "Vocational / NC II",
        })
        .select("id")
        .single();
      fail(inserted.error, `candidate ${person.email}`);
      candidateId = inserted.data.id;
    } else {
      await admin
        .from("crowne_candidates")
        .update({
          full_name: person.name,
          status: person.stage === "Selected" ? "For processing" : "Active",
          preferred_role: person.role,
          preferred_destination: person.destination,
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidateId);
    }

    const publication = pickPublication(publications, person.role, person.destination, index);
    const appliedOn = new Date();
    appliedOn.setDate(appliedOn.getDate() - (APPLICANTS.length - index));

    const { data: existingApp } = await admin
      .from("crowne_applications")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("publication_id", publication.id)
      .maybeSingle();

    let applicationId = existingApp?.id ?? null;
    if (!applicationId) {
      const inserted = await admin
        .from("crowne_applications")
        .insert({
          reference: ref("APP"),
          candidate_id: candidateId,
          job_order_id: publication.jobOrderId,
          publication_id: publication.id,
          stage: person.stage,
          source: "Agency portal",
          applied_on: appliedOn.toISOString().slice(0, 10),
          recruiter: index % 2 === 0 ? "Ana Reyes" : "John Dela Cruz",
        })
        .select("id")
        .single();
      fail(inserted.error, `application ${person.email}`);
      applicationId = inserted.data.id;

      await admin.from("crowne_application_status_history").insert({
        application_id: applicationId,
        previous_stage: null,
        new_stage: person.stage,
        reason: "Scaffold demo seed",
      });
    } else {
      await admin
        .from("crowne_applications")
        .update({ stage: person.stage, updated_at: new Date().toISOString() })
        .eq("id", applicationId);
    }

    if (person.stage === "Selected") {
      const { data: existingProcessing } = await admin
        .from("crowne_processing_records")
        .select("id")
        .eq("application_id", applicationId)
        .maybeSingle();
      if (!existingProcessing) {
        const checklist = checklistForStage(person.stage, index) ?? CHECKLIST;
        const processing = await admin
          .from("crowne_processing_records")
          .insert({
            reference: ref("PRC"),
            application_id: applicationId,
            next_action: checklist.find((item) => item.state === "Pending")?.label ?? "Mark ready for deployment",
            status: "In progress",
          })
          .select("id")
          .single();
        fail(processing.error, `processing ${person.email}`);
        const items = await admin.from("crowne_processing_checklist_items").insert(
          checklist.map((item) => ({
            processing_record_id: processing.data.id,
            label: item.label,
            state: item.state,
            sensitivity: item.sensitivity,
          })),
        );
        fail(items.error, `checklist ${person.email}`);
      }
    }

    created.push({ name: person.name, email: person.email, stage: person.stage, job: publication.title });
  }

  console.log(`Created ${created.length} applicants with staged applications.`);
  return created;
}

async function main() {
  if (force) await clearScaffold();
  else {
    const { data: existing } = await admin
      .from("crowne_employers")
      .select("id")
      .eq("contact_name", MARKER)
      .limit(1);
    if ((existing ?? []).length) {
      console.error("Scaffold data already exists. Re-run with --force to replace it.");
      process.exit(1);
    }
  }

  const publications = await seedJobs();
  const applicants = await seedApplicants(publications);

  console.log("\nScaffold ready.");
  console.log(`Jobs published: ${publications.length}`);
  console.log("Applicant password:", PASSWORD);
  console.log("Sample accounts:");
  for (const person of applicants) {
    console.log(`  ${person.stage.padEnd(16)} ${person.email} → ${person.job}`);
  }
  void COUNTRIES;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
