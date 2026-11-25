import { jsonError, readJson } from "@/lib/api/http";
import { respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { listCandidates, updateCandidate } from "@/lib/data/repository";
import { profileSchema } from "@/lib/validation/api";

export async function GET() {
  const { session, response } = await requireSession("applicant");
  if (response || !session?.candidateId) return response ?? jsonError(404, "not_found", "No applicant profile is linked to this session.");
  return respond(async () => {
    const candidates = await listCandidates();
    return candidates.find((candidate) => candidate.id === session.candidateId) ?? null;
  });
}

export async function PATCH(request: Request) {
  const { session, response } = await requireSession("applicant");
  if (response || !session?.candidateId) return response ?? jsonError(404, "not_found", "No applicant profile is linked to this session.");
  const parsed = profileSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_profile", "Check the profile fields and try again.");
  return respond(() => updateCandidate(session.candidateId as string, parsed.data));
}
