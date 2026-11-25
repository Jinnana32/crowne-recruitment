import { jsonError, readJson } from "@/lib/api/http";
import { respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { listEducation, saveEducation } from "@/lib/data/repository";
import { educationSchema } from "@/lib/validation/api";

export async function GET() {
  const { session, response } = await requireSession("applicant");
  if (response || !session?.candidateId) return response ?? jsonError(404, "not_found", "No applicant profile is linked to this session.");
  return respond(() => listEducation(session.candidateId as string));
}

export async function POST(request: Request) {
  const { session, response } = await requireSession("applicant");
  if (response || !session?.candidateId) return response ?? jsonError(404, "not_found", "No applicant profile is linked to this session.");
  const parsed = educationSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_education", parsed.error.issues[0]?.message ?? "Check the education fields.");
  return respond(() => saveEducation(session.candidateId as string, parsed.data));
}
