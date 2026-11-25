import { jsonError, readJson } from "@/lib/api/http";
import { respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { createApplication, listApplications } from "@/lib/data/repository";
import { applicationSchema } from "@/lib/validation/api";

export async function GET() {
  const { session, response } = await requireSession();
  if (response || !session) return response;
  return respond(async () => {
    const applications = await listApplications();
    if (session.role === "applicant") {
      return applications.filter((application) => application.candidateId === session.candidateId);
    }
    return applications;
  });
}

export async function POST(request: Request) {
  const { session, response } = await requireSession("applicant");
  if (response || !session) return response;
  if (!session.candidateId) {
    return jsonError(409, "profile_missing", "Create an applicant profile before applying.");
  }
  const parsed = applicationSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_application", "Choose a published job.");
  const result = await createApplication({
    candidateId: session.candidateId,
    publicationId: parsed.data.publicationId,
  });
  if (!result.ok) return jsonError(409, "duplicate_application", result.reason);
  return respond(async () => result.application);
}
