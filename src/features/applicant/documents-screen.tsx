"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type DragEvent, type FormEvent, type ReactNode, useRef, useState } from "react";
import { CloudUpload, Download, Ellipsis, ExternalLink, FileImage, FileText, Lock, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api/browser";
import type { CandidateDocument, DocumentRequest, DocumentsView } from "@/lib/data/types";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_MIME_TYPES,
  DOCUMENT_RULE_LABEL,
  displayNameFromFilename,
  formatBytes,
  MAX_DOCUMENT_BYTES,
  type RequestState,
} from "@/lib/domain/documents";
import { cn } from "cn";

export const documentsKey = ["documents"] as const;

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function formatDocumentDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
}

/** Checked again on the server from the file signature. This only gives a fast answer. */
function rejectReason(file: File) {
  if (file.size === 0) return "That file is empty. Choose another file.";
  if (file.size > MAX_DOCUMENT_BYTES) return `${file.name} is ${formatBytes(file.size)}. Choose a file that is 10 MB or smaller.`;
  const typeOk = (DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type);
  const extensionOk = /\.(pdf|jpe?g|png)$/i.test(file.name);
  if (!typeOk && !extensionOk) return "Upload a PDF, JPG, or PNG file.";
  return null;
}

function sendFile(body: FormData, onProgress: (percent: number) => void) {
  return new Promise<CandidateDocument>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/documents");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      let parsed: { data?: CandidateDocument; error?: { message?: string } } = {};
      try {
        parsed = JSON.parse(request.responseText);
      } catch {}
      if (request.status >= 200 && request.status < 300 && parsed.data) resolve(parsed.data);
      else reject(new ApiError(parsed.error?.message ?? "The file could not be uploaded."));
    };
    request.onerror = () => reject(new ApiError("The upload stopped. Check your connection and try again."));
    request.send(body);
  });
}

type UploadInput = { file: File; name: string; requestId: string | null };
type Progress = { label: string; percent: number };

function useUpload() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<Progress | null>(null);
  const mutation = useMutation({
    mutationFn: async ({ file, name, requestId }: UploadInput) => {
      const body = new FormData();
      body.set("file", file);
      if (name) body.set("name", name);
      if (requestId) body.set("requestId", requestId);
      setProgress({ label: name || file.name, percent: 0 });
      return sendFile(body, (percent) => setProgress((current) => (current ? { ...current, percent } : current)));
    },
    onSuccess: async (document) => {
      toast.success(`${document.name} uploaded.`);
      await queryClient.invalidateQueries({ queryKey: documentsKey });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The file could not be uploaded."),
    onSettled: () => setProgress(null),
  });
  return { ...mutation, progress };
}

function StatusPill({ value }: { value: RequestState }) {
  const tone: Record<RequestState, string> = {
    Required: "bg-warning-soft text-warning",
    "For review": "bg-royal-soft text-primary",
    Verified: "bg-success-soft text-success",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tone[value])}>{value}</span>;
}

function CountPill({ value, active }: { value: number; active?: boolean }) {
  return (
    <span className={cn("grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
      {value}
    </span>
  );
}

function FileBadge({ document }: { document: Pick<CandidateDocument, "mimeType" | "hasFile"> }) {
  if (document.mimeType === "application/pdf") {
    return (
      <span aria-hidden className="relative grid h-8 w-7 shrink-0 place-items-end rounded-[3px] bg-red-50 ring-1 ring-red-200">
        <span className="mb-1 w-full text-center text-[8px] leading-none font-bold tracking-wide text-red-600">PDF</span>
      </span>
    );
  }
  if (document.mimeType) return <FileImage aria-hidden className="size-6 shrink-0 text-primary" />;
  return <FileText aria-hidden className="size-5 shrink-0 text-muted-foreground" />;
}

function Panel({ title, description, children, ...rest }: { title: string; description: string; children: ReactNode } & Record<`data-${string}`, string | boolean>) {
  return (
    <section className="rounded-xl bg-card p-5 shadow-xs ring-1 ring-border sm:p-6" {...rest}>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 overflow-hidden rounded-lg border border-border">{children}</div>
    </section>
  );
}

function HeaderRow({ columns, className }: { columns: string[]; className: string }) {
  return (
    <div aria-hidden className={cn("hidden border-b border-border bg-secondary/70 px-4 py-2.5 text-xs font-semibold text-muted-foreground sm:grid", className)}>
      {columns.map((column, index) => <span key={`${column}-${index}`}>{column}</span>)}
    </div>
  );
}

function Dropzone({ busy, progress, onFile }: { busy: boolean; progress: Progress | null; onFile: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function drop(event: DragEvent) {
    event.preventDefault();
    setOver(false);
    const file = event.dataTransfer.files[0];
    if (file && !busy) onFile(file);
  }

  return (
    <div
      data-docs-dropzone
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) input.current?.click();
      }}
      className={cn(
        "grid min-h-44 place-items-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
        over ? "border-primary bg-royal-soft" : "border-primary/30 bg-[#F8F9FF]",
        busy ? "cursor-progress" : "cursor-pointer hover:border-primary/50",
      )}
    >
      <input
        ref={input}
        type="file"
        accept={DOCUMENT_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      {progress ? (
        <div className="w-full max-w-sm" role="status" aria-live="polite">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-royal-soft text-primary">
            <CloudUpload className="size-6 motion-safe:animate-pulse" />
          </span>
          <p className="mt-3 truncate text-sm font-semibold">Uploading {progress.label}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground tabular-nums">{progress.percent < 100 ? `${progress.percent}% sent` : "Saving to your file…"}</p>
        </div>
      ) : (
        <div className="pointer-events-none grid justify-items-center">
          <span className="grid size-12 place-items-center rounded-xl bg-royal-soft text-primary">
            <CloudUpload className="size-6" />
          </span>
          <p className="mt-3 text-base font-bold text-foreground">{over ? "Drop to upload" : "Upload a document"}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Drag and drop a file here, or click to browse.</p>
          <Button type="button" className="pointer-events-auto mt-4 h-9 px-4" disabled={busy} onClick={() => input.current?.click()}>
            <Upload className="size-4" />
            Choose file
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">{DOCUMENT_RULE_LABEL}</p>
        </div>
      )}
    </div>
  );
}

function RequestRows({ requests, busy, onUpload }: { requests: DocumentRequest[]; busy: boolean; onUpload: (request: DocumentRequest) => void }) {
  if (requests.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-sm font-semibold">No documents requested yet</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">The recruitment team lists documents here when they need them. You can still upload files above.</p>
      </div>
    );
  }
  return (
    <>
      <HeaderRow columns={["Document", "Description", "Status", "Action"]} className="grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_7rem_6.5rem]" />
      <ul className="divide-y divide-border">
        {requests.map((request) => (
          <li key={request.id} data-docs-request className="grid gap-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_7rem_6.5rem] sm:items-center sm:gap-x-4">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <FileText aria-hidden className="mt-0.5 size-[18px] shrink-0 text-muted-foreground sm:mt-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-foreground">{request.name}</span>
                  {request.sensitivity === "medical" ? (
                    <span title="After upload, only authorised medical staff can open this file." className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <Lock className="size-3" />
                      Private
                    </span>
                  ) : null}
                  <span className="sm:hidden">
                    <StatusPill value={request.state} />
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">{request.description || "—"}</p>
              </div>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">{request.description || "—"}</p>
            <div className="hidden sm:block">
              <StatusPill value={request.state} />
            </div>
            <div className="pl-[30px] sm:justify-self-end sm:pl-0">
              {request.state === "Verified" ? (
                <span className="text-xs text-muted-foreground">Accepted</span>
              ) : (
                <Button type="button" variant="outline" size="sm" className="h-8 bg-card px-3" disabled={busy} aria-label={`${request.state === "Required" ? "Upload" : "Replace"} ${request.name}`} onClick={() => onUpload(request)}>
                  <Upload className="size-3.5" />
                  {request.state === "Required" ? "Upload" : "Replace"}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function DocumentRows({ documents, onDelete }: { documents: CandidateDocument[]; onDelete: (document: CandidateDocument) => void }) {
  if (documents.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-sm font-semibold">No files uploaded yet</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">Upload a file above, or upload against a requested document.</p>
      </div>
    );
  }
  return (
    <>
      <HeaderRow columns={["Document", "Date uploaded", "Status", ""]} className="grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_7rem_2.5rem]" />
      <ul className="divide-y divide-border">
        {documents.map((document) => {
          const href = `/api/documents/${document.id}/file`;
          const canOpen = document.hasFile && document.sensitivity === "standard";
          const canDelete = document.sensitivity === "standard" && document.status === "For review";
          const detail = !document.hasFile
            ? "Name only, no file attached"
            : [document.originalFilename, formatBytes(document.sizeBytes)].filter(Boolean).join(" · ");
          return (
            <li key={document.id} data-docs-file className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_7rem_2.5rem] sm:gap-x-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileBadge document={document} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <span className="truncate">{document.name}</span>
                    {document.sensitivity === "medical" ? <Lock aria-label="Private medical file" className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="sm:hidden">{formatDocumentDate(document.uploadedAt)} · </span>
                    {detail}
                  </p>
                </div>
              </div>
              <span className="hidden text-sm text-muted-foreground sm:block">{formatDocumentDate(document.uploadedAt)}</span>
              <StatusPill value={document.status} />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button type="button" variant="outline" size="icon" className="size-8 justify-self-end bg-card" aria-label={`Actions for ${document.name}`} />}
                >
                  <Ellipsis className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {canOpen ? (
                    <>
                      <DropdownMenuItem render={<a href={href} target="_blank" rel="noopener" />}>
                        <ExternalLink className="size-4" />
                        Open in new tab
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<a href={`${href}?download=1`} download />}>
                        <Download className="size-4" />
                        Download
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">
                      {document.hasFile ? "Only authorised medical staff can open this file." : "No file is attached to this record."}
                    </p>
                  )}
                  {canDelete ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(document)}>
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function NameDialog({
  file,
  requests,
  pending,
  onCancel,
  onSubmit,
}: {
  file: File | null;
  requests: DocumentRequest[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: { name: string; requestId: string | null }) => void;
}) {
  const [name, setName] = useState("");
  const [requestId, setRequestId] = useState("");
  const [seen, setSeen] = useState<File | null>(null);
  if (file !== seen) {
    setSeen(file);
    setName(file ? displayNameFromFilename(file.name) : "");
    setRequestId("");
  }
  const open = requests.filter((request) => request.state !== "Verified");

  function submit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    const chosen = requests.find((request) => request.id === requestId);
    onSubmit({ name: name.trim() || chosen?.name || "", requestId: chosen?.id ?? null });
  }

  return (
    <Dialog open={Boolean(file)} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>Name the file so the recruitment team knows what it is.</DialogDescription>
        </DialogHeader>
        {file ? (
          <form id="document-upload-form" onSubmit={submit} className="grid gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2.5">
              <FileBadge document={{ mimeType: file.type === "application/pdf" ? "application/pdf" : "image/png", hasFile: true }} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document-name">Document name</Label>
              <Input id="document-name" value={name} maxLength={160} onChange={(event) => setName(event.target.value)} required className="h-10" />
            </div>
            {open.length > 0 ? (
              <div className="grid gap-2">
                <Label htmlFor="document-request">Requested document</Label>
                <select
                  id="document-request"
                  value={requestId}
                  onChange={(event) => {
                    const chosen = open.find((request) => request.id === event.target.value);
                    setRequestId(event.target.value);
                    if (chosen) setName(chosen.name);
                  }}
                  className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Not for a request</option>
                  {open.map((request) => (
                    <option key={request.id} value={request.id}>{request.name}</option>
                  ))}
                </select>
              </div>
            ) : null}
          </form>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" className="h-10 px-5" onClick={onCancel}>Cancel</Button>
          <Button type="submit" form="document-upload-form" className="h-10 px-5" disabled={pending}>
            <Upload className="size-4" />
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDelete({ document, pending, onCancel, onConfirm }: { document: CandidateDocument | null; pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={Boolean(document)} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this document?</DialogTitle>
          <DialogDescription>{document?.name} and its file will be removed. The recruitment team will no longer see it.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="h-10 px-5" onClick={onCancel}>Keep document</Button>
          <Button type="button" className="h-10 bg-destructive px-5 text-white hover:bg-destructive/90" disabled={pending} onClick={onConfirm}>
            {pending ? "Deleting…" : "Delete document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoadingRows() {
  return (
    <ul aria-label="Loading documents" className="divide-y divide-border">
      {[0, 1, 2].map((row) => (
        <li key={row} className="flex items-center gap-3 px-4 py-3.5">
          <span className="size-5 rounded bg-muted motion-safe:animate-pulse" />
          <span className="h-3 w-40 rounded bg-muted motion-safe:animate-pulse" />
          <span className="ml-auto h-5 w-16 rounded-full bg-muted motion-safe:animate-pulse" />
        </li>
      ))}
    </ul>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="px-6 py-8 text-center">
      <p className="text-sm font-semibold text-destructive">{message}</p>
      <Button type="button" variant="outline" size="sm" className="mt-3 h-8" onClick={onRetry}>Try again</Button>
    </div>
  );
}

const triggerClass =
  "h-auto flex-none gap-2 rounded-none px-1 pb-3 pt-1 text-sm font-semibold text-muted-foreground data-active:text-primary group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-0.5 after:rounded-full after:bg-primary sm:px-2";

export function DocumentsScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: documentsKey, queryFn: async () => (await api<DocumentsView>("/api/documents")).data });
  const upload = useUpload();
  const [tab, setTab] = useState("requested");
  const [staged, setStaged] = useState<File | null>(null);
  const [deleting, setDeleting] = useState<CandidateDocument | null>(null);
  const requestInput = useRef<HTMLInputElement>(null);
  const targetRef = useRef<DocumentRequest | null>(null);

  const remove = useMutation({
    mutationFn: async (document: CandidateDocument) => api(`/api/documents/${document.id}`, { method: "DELETE" }),
    onSuccess: async (_data, document) => {
      toast.success(`${document.name} deleted.`);
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: documentsKey });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The document could not be deleted."),
  });

  function accept(file: File, next: (file: File) => void) {
    const reason = rejectReason(file);
    if (reason) toast.error(reason);
    else next(file);
  }

  const requests = query.data?.requests ?? [];
  const documents = query.data?.documents ?? [];
  const busy = upload.isPending;

  const body = (content: ReactNode) =>
    query.isLoading ? <LoadingRows /> : query.isError ? <LoadError message={query.error.message} onRetry={() => query.refetch()} /> : content;

  const uploadedPanel = (
    <Panel title="Uploaded documents" description="Documents you have submitted." data-docs-uploaded>
      {body(<DocumentRows documents={documents} onDelete={setDeleting} />)}
    </Panel>
  );

  return (
    <div className="mx-auto max-w-[1040px]">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-primary">My Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your required and submitted documents for your application.</p>
      </header>

      <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="mt-5 gap-0">
        <TabsList variant="line" className="h-auto w-full justify-start gap-5 border-b border-border p-0">
          <TabsTrigger value="requested" className={triggerClass}>
            <span className="sm:hidden">Requested</span>
            <span className="hidden sm:inline">Requested documents</span>
            <CountPill value={requests.length} active={tab === "requested"} />
          </TabsTrigger>
          <TabsTrigger value="uploaded" className={triggerClass}>
            <span className="sm:hidden">Uploaded</span>
            <span className="hidden sm:inline">Uploaded documents</span>
            <CountPill value={documents.length} active={tab === "uploaded"} />
          </TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <Dropzone busy={busy} progress={upload.progress} onFile={(file) => accept(file, setStaged)} />
        </div>

        <TabsContent value="requested" className="mt-5 grid gap-5">
          <Panel title="Requested documents" description="Documents the recruitment team needs from you." data-docs-requested>
            {body(
              <RequestRows
                requests={requests}
                busy={busy}
                onUpload={(request) => {
                  targetRef.current = request;
                  requestInput.current?.click();
                }}
              />,
            )}
          </Panel>
          {uploadedPanel}
        </TabsContent>
        <TabsContent value="uploaded" className="mt-5 grid gap-5">
          {uploadedPanel}
        </TabsContent>
      </Tabs>

      <input
        ref={requestInput}
        type="file"
        accept={DOCUMENT_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          const target = targetRef.current;
          event.target.value = "";
          targetRef.current = null;
          if (file && target) accept(file, (ok) => upload.mutate({ file: ok, name: target.name, requestId: target.id }));
        }}
      />

      <NameDialog
        file={staged}
        requests={requests}
        pending={busy}
        onCancel={() => setStaged(null)}
        onSubmit={({ name, requestId }) => {
          if (staged) upload.mutate({ file: staged, name, requestId });
          setStaged(null);
        }}
      />
      <ConfirmDelete document={deleting} pending={remove.isPending} onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting)} />
    </div>
  );
}
