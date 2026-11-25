import { jsonError, readJson } from "@/lib/api/http";
import { respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { updateJobOrder } from "@/lib/data/repository";
import { jobOrderUpdateSchema } from "@/lib/validation/api";

export async function PATCH(request: Request, context: { params: Promise<{ jobOrderId: string }> }) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  const parsed = jobOrderUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_job_order", "Enter the job title, vacancies, and listing details.");
  const { jobOrderId } = await context.params;
  const updated = await updateJobOrder(jobOrderId, parsed.data);
  if (!updated) return jsonError(404, "not_found", "That job order was not found.");
  return respond(async () => updated);
}
