import type { CandidateDocument } from "@/lib/data/types";
import type { DocumentMime } from "@/lib/domain/documents";

export type DocumentEventAction = "uploaded" | "opened" | "deleted" | "verified" | "requested" | "request_removed";

export type DocumentActor = { role: "staff" | "applicant"; candidateId: string | null };

/** mime is the type detected from the file signature, not the browser's claim. */
export type DocumentUpload = {
  candidateId: string;
  actorId: string | null;
  name: string;
  requestId: string | null;
  originalFilename: string;
  mime: DocumentMime;
  bytes: Uint8Array;
};

export type UploadResult = { ok: true; document: CandidateDocument } | { ok: false; reason: "request_not_found" };

export type DeleteResult = "deleted" | "not_found" | "locked";

export type OpenResult =
  | { kind: "file"; bytes: Uint8Array; mime: DocumentMime; filename: string }
  | { kind: "not_found" }
  | { kind: "restricted" }
  | { kind: "no_file" };
