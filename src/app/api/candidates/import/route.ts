import { jsonError, readJson } from "@/lib/api/http";
import { respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { importCandidates } from "@/lib/data/repository";
import type { Candidate } from "@/lib/data/types";
import { importSchema } from "@/lib/validation/api";

const sources = new Set<Candidate["source"]>(["Agency portal", "WorkAbroad", "Walk-in", "Referral"]);

export async function POST(request: Request) {
  const { session, response } = await requireSession("staff");
  if (response || !session) return response;
  const parsed = importSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(422, "invalid_import", "Paste a CSV with fullName and email columns.");

  const [headerLine, ...lines] = parsed.data.csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = headerLine?.split(",").map((header) => header.trim()) ?? [];
  const nameIndex = headers.indexOf("fullName");
  const emailIndex = headers.indexOf("email");
  const sourceIndex = headers.indexOf("source");
  if (nameIndex < 0 || emailIndex < 0) {
    return jsonError(422, "invalid_import", "The CSV header must include fullName and email.");
  }

  const rows = lines.flatMap((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    const fullName = cells[nameIndex] ?? "";
    const email = cells[emailIndex] ?? "";
    const sourceValue = sourceIndex >= 0 ? cells[sourceIndex] : "Agency portal";
    const source = sources.has(sourceValue as Candidate["source"])
      ? (sourceValue as Candidate["source"])
      : "Agency portal";
    if (!fullName || !email.includes("@")) return [];
    return [{ fullName, email, source }];
  });

  return respond(() => importCandidates(rows));
}
