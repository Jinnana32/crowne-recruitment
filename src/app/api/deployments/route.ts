import { jsonError, readJson } from "@/lib/api/http";
import { respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { createDeploymentFromProcessing, listDeployments } from "@/lib/data/repository";
import { createDeploymentSchema } from "@/lib/validation/api";

export async function GET() {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  return respond(() => listDeployments());
}

export async function POST(request: Request) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;

  const parsed = createDeploymentSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_deployment", "Choose a ready processing record and departure date.");

  const result = await createDeploymentFromProcessing(parsed.data.processingId, parsed.data.departureDate);
  if (!result.ok) {
    if (result.reason === "not_ready") {
      return jsonError(422, "not_ready", "Mark processing ready before scheduling departure.");
    }
    if (result.reason === "exists") {
      return jsonError(409, "exists", "A departure is already scheduled for this application.");
    }
    return jsonError(404, "not_found", "That processing record was not found.");
  }
  return respond(async () => result.deployment);
}
