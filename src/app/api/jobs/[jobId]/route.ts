import { jsonError } from "@/lib/api/http";
import { respond } from "@/lib/api/respond";
import { getPublicJob } from "@/lib/data/repository";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = await getPublicJob(jobId).catch((error: unknown) => {
    throw error;
  });
  if (!job) return jsonError(404, "not_found", "That job is not published.");
  return respond(async () => job);
}
