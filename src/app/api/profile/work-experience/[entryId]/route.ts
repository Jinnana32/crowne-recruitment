import { jsonData, jsonError, readJson } from "@/lib/api/http";
import { requireSession } from "@/lib/auth/guard";
import { DataUnavailableError, deleteWorkExperience, saveWorkExperience } from "@/lib/data/repository";
import { workExperienceSchema } from "@/lib/validation/api";

type Context = { params: Promise<{ entryId: string }> };

async function run<T>(work: () => Promise<T | null | false>) {
  try {
    const result = await work();
    if (!result) return jsonError(404, "not_found", "That work experience entry was not found.");
    return jsonData(result);
  } catch (error) {
    if (error instanceof DataUnavailableError) return jsonError(503, "unavailable", error.message);
    console.error(error);
    return jsonError(500, "server_error", "The request could not be completed.");
  }
}

export async function PATCH(request: Request, context: Context) {
  const { session, response } = await requireSession("applicant");
  if (response || !session?.candidateId) return response ?? jsonError(404, "not_found", "No applicant profile is linked to this session.");
  const parsed = workExperienceSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_work_experience", parsed.error.issues[0]?.message ?? "Check the work experience fields.");
  const { entryId } = await context.params;
  return run(() => saveWorkExperience(session.candidateId as string, parsed.data, entryId));
}

export async function DELETE(_request: Request, context: Context) {
  const { session, response } = await requireSession("applicant");
  if (response || !session?.candidateId) return response ?? jsonError(404, "not_found", "No applicant profile is linked to this session.");
  const { entryId } = await context.params;
  return run(async () => ((await deleteWorkExperience(session.candidateId as string, entryId)) ? { id: entryId } : null));
}
