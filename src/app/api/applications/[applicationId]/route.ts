import { jsonError, readJson } from "@/lib/api/http";
import { respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { updateApplicationStage } from "@/lib/data/repository";
import { stageSchema } from "@/lib/validation/api";

export async function PATCH(request: Request, context: { params: Promise<{ applicationId: string }> }) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  const parsed = stageSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_stage", "Choose a valid application stage.");
  const { applicationId } = await context.params;
  const updated = await updateApplicationStage(applicationId, parsed.data.stage);
  if (!updated) return jsonError(404, "not_found", "That application was not found.");
  return respond(async () => updated);
}
