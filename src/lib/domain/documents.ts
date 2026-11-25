/** Provisional upload rule from the approved mock. Crowne has not confirmed it (docs/OPEN_QUESTIONS.md). */
export const DOCUMENT_BUCKET = "crowne-candidate-documents";
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
export const DOCUMENT_RULE_LABEL = "PDF, JPG, or PNG · Up to 10 MB";

export type DocumentMime = (typeof DOCUMENT_MIME_TYPES)[number];
export type DocumentSensitivity = "standard" | "medical";
export type DocumentStatus = "For review" | "Verified";
export type RequestState = "Required" | DocumentStatus;

const EXTENSIONS: Record<DocumentMime, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

/** Reads the file signature. The browser-supplied type and the extension are not trusted. */
export function detectDocumentType(bytes: Uint8Array): DocumentMime | null {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  return null;
}

export function isDocumentMime(value: unknown): value is DocumentMime {
  return typeof value === "string" && (DOCUMENT_MIME_TYPES as readonly string[]).includes(value);
}

export function documentStoragePath(candidateId: string, sensitivity: DocumentSensitivity, mime: DocumentMime) {
  return `${candidateId}/${sensitivity}/${crypto.randomUUID()}.${EXTENSIONS[mime]}`;
}

/** File name without its extension, collapsed whitespace, at most 160 characters. */
export function displayNameFromFilename(filename: string) {
  const base = filename.replace(/\.[A-Za-z0-9]{1,5}$/, "");
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[_\s]+/g, " ").trim();
  return (cleaned || "Document").slice(0, 160);
}

export function downloadFilename(name: string, mime: DocumentMime) {
  const safe = name.replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, "").trim() || "document";
  return `${safe}.${EXTENSIONS[mime]}`;
}

export function contentDisposition(filename: string, inline: boolean) {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** A request is satisfied by the newest file submitted against it. */
export function requestState(
  requestId: string,
  documents: Array<{ id: string; requestId: string | null; status: DocumentStatus; uploadedAt: string }>,
): { state: RequestState; documentId: string | null } {
  const latest = documents
    .filter((document) => document.requestId === requestId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
  return { state: latest?.status ?? "Required", documentId: latest?.id ?? null };
}
