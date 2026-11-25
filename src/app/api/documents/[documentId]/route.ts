import { jsonData, jsonError, readJson } from "@/lib/api/http";
import { guarded } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { deleteDocument, reviewDocument } from "@/lib/data/repository";
import { documentReviewSchema } from "@/lib/validation/api";

type Context = { params: Promise<{ documentId: string }> };

export async function PATCH(request: Request, context: Context) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  const parsed = documentReviewSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_review", "Choose For review or Verified.");
  const { documentId } = await context.params;
  return guarded(async () => {
    const document = await reviewDocument(documentId, parsed.data.status);
    return document ? jsonData(document) : jsonError(404, "not_found", "That document was not found, or your role cannot review it.");
  });
}

export async function DELETE(_request: Request, context: Context) {
  const { session, response } = await requireSession("applicant");
  if (response || !session?.candidateId) return response ?? jsonError(404, "not_found", "No applicant profile is linked to this session.");
  const { documentId } = await context.params;
  return guarded(async () => {
    const result = await deleteDocument(session.candidateId as string, documentId);
    if (result === "not_found") return jsonError(404, "not_found", "That document was not found.");
    if (result === "locked") return jsonError(409, "document_locked", "Verified and medical documents can only be changed by the recruitment team.");
    return jsonData({ id: documentId });
  });
}
