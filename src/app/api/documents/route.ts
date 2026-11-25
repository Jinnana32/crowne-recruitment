import { jsonData, jsonError } from "@/lib/api/http";
import { guarded, respond } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/guard";
import { listDocuments, uploadDocument } from "@/lib/data/repository";
import { detectDocumentType, MAX_DOCUMENT_BYTES } from "@/lib/domain/documents";
import { documentUploadFieldsSchema } from "@/lib/validation/api";

const FORM_OVERHEAD_BYTES = 64 * 1024;

export async function GET() {
  const { session, response } = await requireSession("applicant");
  if (response || !session?.candidateId) return response ?? jsonError(404, "not_found", "No applicant profile is linked to this session.");
  return respond(() => listDocuments(session.candidateId as string));
}

export async function POST(request: Request) {
  const { session, response } = await requireSession("applicant");
  if (response || !session?.candidateId) return response ?? jsonError(404, "not_found", "No applicant profile is linked to this session.");
  const candidateId = session.candidateId;

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_DOCUMENT_BYTES + FORM_OVERHEAD_BYTES) return jsonError(413, "file_too_large", "Choose a file that is 10 MB or smaller.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "invalid_upload", "Send the file as multipart form data.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError(422, "missing_file", "Choose a file to upload.");
  if (file.size > MAX_DOCUMENT_BYTES) return jsonError(413, "file_too_large", "Choose a file that is 10 MB or smaller.");

  const fields = documentUploadFieldsSchema.safeParse({
    name: form.get("name") ?? undefined,
    requestId: form.get("requestId") ?? undefined,
  });
  if (!fields.success) return jsonError(422, "invalid_document", fields.error.issues[0]?.message ?? "Check the document details.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectDocumentType(bytes);
  if (!mime) return jsonError(415, "unsupported_file", "Upload a PDF, JPG, or PNG file.");

  return guarded(async () => {
    const result = await uploadDocument({
      candidateId,
      actorId: session.userId,
      name: fields.data.name,
      requestId: fields.data.requestId || null,
      originalFilename: file.name || "document",
      mime,
      bytes,
    });
    if (!result.ok) return jsonError(404, "request_not_found", "That document request is no longer open.");
    return jsonData(result.document, 201);
  });
}
