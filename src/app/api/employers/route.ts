import { requireSession } from "@/lib/auth/guard";
import { respond } from "@/lib/api/respond";
import { listEmployers } from "@/lib/data/repository";

export async function GET() {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  return respond(() => listEmployers());
}
