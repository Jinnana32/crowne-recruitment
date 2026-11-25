import { jsonData, jsonError } from "@/lib/api/http";
import { guarded } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { deleteDocumentRequest } from "@/lib/data/repository";

type Context = { params: Promise<{ candidateId: string; requestId: string }> };

export async function DELETE(_request: Request, context: Context) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  const { candidateId, requestId } = await context.params;
  return guarded(async () =>
    (await deleteDocumentRequest(candidateId, requestId))
      ? jsonData({ id: requestId })
      : jsonError(404, "not_found", "That document request was not found."),
  );
}
