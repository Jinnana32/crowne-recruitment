import { respond } from "@/lib/api/respond";
import { listPublicJobs } from "@/lib/data/repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return respond(() =>
    listPublicJobs({
      query: url.searchParams.get("query") ?? undefined,
      country: url.searchParams.get("country") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
    }),
  );
}
