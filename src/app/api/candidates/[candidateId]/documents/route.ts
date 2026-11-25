import { respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { listDocuments } from "@/lib/data/repository";

type Context = { params: Promise<{ candidateId: string }> };

export async function GET(_request: Request, context: Context) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  const { candidateId } = await context.params;
  return respond(() => listDocuments(candidateId));
}
