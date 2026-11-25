import { jsonError, readJson } from "@/lib/api/http";
import { respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { markProcessingReady, updateChecklistItem } from "@/lib/data/repository";
import { checklistItemUpdateSchema, markProcessingReadySchema } from "@/lib/validation/api";

type Context = { params: Promise<{ processingId: string }> };

export async function PATCH(request: Request, context: Context) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;

  const body = await readJson(request);
  const { processingId } = await context.params;

  const ready = markProcessingReadySchema.safeParse(body);
  if (ready.success) {
    const result = await markProcessingReady(processingId);
    if (!result.ok) {
      if (result.reason === "incomplete") {
        return jsonError(422, "incomplete", "Finish every checklist item before marking ready.");
      }
      return jsonError(404, "not_found", "That processing record was not found.");
    }
    return respond(async () => result.record);
  }

  const item = checklistItemUpdateSchema.safeParse(body);
  if (!item.success) return jsonError(422, "invalid_processing", "Choose a checklist update or mark ready.");

  const result = await updateChecklistItem(processingId, item.data.label, item.data.state);
  if (!result.ok) {
    if (result.reason === "already_ready") {
      return jsonError(409, "already_ready", "This processing record is already ready for deployment.");
    }
    if (result.reason === "invalid_state") {
      return jsonError(422, "invalid_state", "That checklist state is not valid for this item.");
    }
    if (result.reason === "item_not_found") {
      return jsonError(404, "item_not_found", "That checklist item was not found.");
    }
    return jsonError(404, "not_found", "That processing record was not found.");
  }
  return respond(async () => result.record);
}
