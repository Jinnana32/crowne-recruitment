import { jsonError, readJson } from "@/lib/api/http";
import { requireSession } from "@/lib/auth/guard";
import { respond } from "@/lib/api/respond";
import { createJobOpening, listJobOrders } from "@/lib/data/repository";
import { jobOpeningSchema } from "@/lib/validation/api";

export async function GET() {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  return respond(() => listJobOrders());
}

export async function POST(request: Request) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  const parsed = jobOpeningSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_job_order", "Enter the employer, job, vacancies, and compensation label.");
  return respond(() => createJobOpening(parsed.data));
}
