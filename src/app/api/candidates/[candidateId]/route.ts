import { jsonData, jsonError } from "@/lib/api/http";
import { requireSession } from "@/lib/auth/guard";
import { getCandidate } from "@/lib/data/repository";

type Context = { params: Promise<{ candidateId: string }> };

export async function GET(_request: Request, context: Context) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  const { candidateId } = await context.params;
  try {
    const candidate = await getCandidate(candidateId);
    if (!candidate) return jsonError(404, "not_found", "That candidate was not found.");
    return jsonData(candidate);
  } catch (error) {
    return jsonError(500, "server_error", error instanceof Error ? error.message : "The candidate could not be loaded.");
  }
}
