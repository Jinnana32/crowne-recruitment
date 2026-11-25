"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { ExternalLink, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/browser";
import type { DocumentsView } from "@/lib/data/types";
import { formatBytes, type DocumentStatus, type RequestState } from "@/lib/domain/documents";
import { cn } from "cn";

const tone: Record<RequestState, string> = {
  Required: "bg-warning-soft text-warning",
  "For review": "bg-royal-soft text-primary",
  Verified: "bg-success-soft text-success",
};

function Pill({ value }: { value: RequestState }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", tone[value])}>{value}</span>;
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function CandidateDocumentsPanel({ candidateId }: { candidateId: string }) {
  const queryClient = useQueryClient();
  const key = ["candidate-documents", candidateId];
  const query = useQuery({
    queryKey: key,
    queryFn: async () => (await api<DocumentsView>(`/api/candidates/${candidateId}/documents`)).data,
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [medical, setMedical] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: key });

  const addRequest = useMutation({
    mutationFn: async () =>
      api(`/api/candidates/${candidateId}/document-requests`, {
        method: "POST",
        body: JSON.stringify({ name, description, sensitivity: medical ? "medical" : "standard" }),
      }),
    onSuccess: async () => {
      toast.success(`${name.trim()} requested.`);
      setName("");
      setDescription("");
      setMedical(false);
      await refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The request could not be added."),
  });
  const removeRequest = useMutation({
    mutationFn: async (requestId: string) => api(`/api/candidates/${candidateId}/document-requests/${requestId}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Request removed.");
      await refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The request could not be removed."),
  });
  const review = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DocumentStatus }) =>
      api(`/api/documents/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: async (_data, { status }) => {
      toast.success(status === "Verified" ? "Marked verified." : "Moved back to review.");
      await refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The document could not be updated."),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    addRequest.mutate();
  }

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading documents…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-destructive">{query.error.message}</p>;
  if (!query.data) return null;

  return (
    <div data-candidate-documents className="grid gap-6">
      <p className="text-sm text-muted-foreground">
        Requests appear on the applicant’s Documents page. Medical files open only for admin and processing roles.
      </p>
      <section className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border">
        <h3 className="text-sm font-bold">Requested documents</h3>
        {query.data.requests.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
            {query.data.requests.map((request) => (
              <li key={request.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{request.name}</span>
                    {request.sensitivity === "medical" ? <Lock aria-label="Medical" className="size-3.5 text-muted-foreground" /> : null}
                  </p>
                  {request.description ? <p className="truncate text-xs text-muted-foreground">{request.description}</p> : null}
                </div>
                <Pill value={request.state} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  aria-label={`Remove request ${request.name}`}
                  disabled={removeRequest.isPending}
                  onClick={() => removeRequest.mutate(request.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl bg-secondary/60 p-4 sm:grid-cols-[1fr_1.4fr]">
          <div className="grid gap-1.5">
            <Label htmlFor="request-name">Document</Label>
            <Input id="request-name" value={name} maxLength={120} required onChange={(event) => setName(event.target.value)} className="h-9 bg-card" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="request-description">Description</Label>
            <Input id="request-description" value={description} maxLength={300} onChange={(event) => setDescription(event.target.value)} className="h-9 bg-card" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={medical} onChange={(event) => setMedical(event.target.checked)} className="size-4 accent-primary" />
            Medical document
          </label>
          <Button type="submit" className="h-9 justify-self-end" disabled={addRequest.isPending}>
            {addRequest.isPending ? "Adding…" : "Add request"}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border">
        <h3 className="text-sm font-bold">Submitted files</h3>
        {query.data.documents.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing submitted yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
            {query.data.documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{document.name}</span>
                    {document.sensitivity === "medical" ? <Lock aria-label="Medical" className="size-3.5 text-muted-foreground" /> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {dateFormat.format(new Date(document.uploadedAt))}
                    {document.hasFile ? ` · ${formatBytes(document.sizeBytes)}` : " · Name only"}
                  </p>
                </div>
                <Pill value={document.status} />
                {document.hasFile ? (
                  <a href={`/api/documents/${document.id}/file`} target="_blank" rel="noopener" className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-primary hover:bg-royal-soft">
                    <ExternalLink className="size-3.5" />
                    Open
                  </a>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: document.id, status: document.status === "Verified" ? "For review" : "Verified" })}
                >
                  {document.status === "Verified" ? "Move to review" : "Mark verified"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
