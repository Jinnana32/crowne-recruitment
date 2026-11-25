import { jsonError } from "@/lib/api/http";
import { guarded } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { openDocument } from "@/lib/data/repository";
import { contentDisposition } from "@/lib/domain/documents";

type Context = { params: Promise<{ documentId: string }> };

export async function GET(request: Request, context: Context) {
  const { session, response } = await requireSession();
  if (response || !session) return response;
  const { documentId } = await context.params;
  const inline = new URL(request.url).searchParams.get("download") !== "1";
  return guarded(async () => {
    const result = await openDocument(documentId, { role: session.role, candidateId: session.candidateId });
    if (result.kind === "not_found") return jsonError(404, "not_found", "That document was not found.");
    if (result.kind === "restricted") return jsonError(403, "restricted", "Only authorised staff can open this document.");
    if (result.kind === "no_file") return jsonError(404, "no_file", "No file is attached to this record.");
    return new Response(Buffer.from(result.bytes), {
      headers: {
        "content-type": result.mime,
        "content-length": String(result.bytes.byteLength),
        "content-disposition": contentDisposition(result.filename, inline),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        ...(result.mime === "application/pdf" ? {} : { "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" }),
      },
    });
  });
}
