import { jsonError, readJson } from "@/lib/api/http";
import { respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { updateDeployment } from "@/lib/data/repository";
import { deploymentUpdateSchema } from "@/lib/validation/api";

type Context = { params: Promise<{ deploymentId: string }> };

export async function PATCH(request: Request, context: Context) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;

  const parsed = deploymentUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_deployment", "Choose a travel or readiness update.");

  const { deploymentId } = await context.params;
  const updated = await updateDeployment(deploymentId, parsed.data);
  if (!updated) return jsonError(404, "not_found", "That deployment was not found.");
  return respond(async () => updated);
}
