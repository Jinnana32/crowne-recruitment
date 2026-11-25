import { requireSession } from "@/lib/auth/guard";
import { respond } from "@/lib/api/respond";
import { listApplicationHistory } from "@/lib/data/repository";

export async function GET(_request: Request, context: { params: Promise<{ applicationId: string }> }) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  const { applicationId } = await context.params;
  return respond(() => listApplicationHistory(applicationId));
}
