import { jsonData, jsonError, readJson } from "@/lib/api/http";
import { guarded } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { createDocumentRequest } from "@/lib/data/repository";
import { documentRequestSchema } from "@/lib/validation/api";

type Context = { params: Promise<{ candidateId: string }> };

export async function POST(request: Request, context: Context) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  const parsed = documentRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_request", parsed.error.issues[0]?.message ?? "Check the request details.");
  const { candidateId } = await context.params;
  return guarded(async () => {
    const created = await createDocumentRequest(candidateId, parsed.data, session.userId);
    return created ? jsonData(created, 201) : jsonError(404, "not_found", "That candidate was not found.");
  });
}
