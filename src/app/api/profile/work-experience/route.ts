import { jsonError, readJson } from "@/lib/api/http";
import { respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { listWorkExperience, saveWorkExperience } from "@/lib/data/repository";
import { workExperienceSchema } from "@/lib/validation/api";

export async function GET() {
  const { session, response } = await requireSession("applicant");
  if (response || !session?.candidateId) return response ?? jsonError(404, "not_found", "No applicant profile is linked to this session.");
  return respond(() => listWorkExperience(session.candidateId as string));
}

export async function POST(request: Request) {
  const { session, response } = await requireSession("applicant");
  if (response || !session?.candidateId) return response ?? jsonError(404, "not_found", "No applicant profile is linked to this session.");
  const parsed = workExperienceSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_work_experience", parsed.error.issues[0]?.message ?? "Check the work experience fields.");
  return respond(() => saveWorkExperience(session.candidateId as string, parsed.data));
}
