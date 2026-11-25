"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/browser";
import type { CandidateView } from "@/lib/data/demo-store";
import { cn } from "cn";

const sample = "fullName,email,source\nElena Ramos,elena.ramos@email.com,Walk-in";

export function CandidatesScreen() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState(sample);
  const candidates = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => (await api<CandidateView[]>("/api/candidates")).data,
  });
  const importCsv = useMutation({
    mutationFn: async () =>
      api<{ created: CandidateView[]; duplicates: string[] }>("/api/candidates/import", {
        method: "POST",
        body: JSON.stringify({ csv }),
      }),
    onSuccess: async (result) => {
      toast.success(`Imported ${result.data.created.length}. Possible duplicates left unmerged: ${result.data.duplicates.length}.`);
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Import failed."),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    importCsv.mutate();
  }

  return (
    <div>
      <PageHeader
        kicker="People database"
        title="Candidates"
        description="One profile per person, with that person's applications counted separately."
        actions={<Button onClick={() => setOpen(true)}>Import candidates</Button>}
      />
      <QueryState isLoading={candidates.isLoading} isError={candidates.isError} error={candidates.error} isEmpty={candidates.data?.length === 0} empty="No candidates yet.">
        <div className="overflow-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                {["Candidate", "Candidate ID", "Latest application", "Applications", "Profile", "Status", ""].map((heading) => (
                  <th key={heading || "actions"} className="px-3 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.data?.map((candidate) => (
                <tr key={candidate.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <strong>{candidate.fullName}</strong>
                    <br />
                    <span className="text-xs text-muted-foreground">{candidate.email}</span>
                  </td>
                  <td className="px-3 py-3">{candidate.reference}</td>
                  <td className="px-3 py-3">{candidate.latestApplication}</td>
                  <td className="px-3 py-3">{candidate.applicationCount}</td>
                  <td className="px-3 py-3">{candidate.profileCompleteness}%</td>
                  <td className="px-3 py-3"><StatusBadge value={candidate.status} /></td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/agency/candidates/${candidate.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
                      aria-label={`Manage ${candidate.fullName}`}
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import candidates</DialogTitle>
            <DialogDescription>CSV only. Matching emails are reported and not merged. WorkAbroad has no API connection here.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-3">
            <Textarea value={csv} onChange={(event) => setCsv(event.target.value)} rows={6} />
            <Button type="submit" disabled={importCsv.isPending}>Review and import</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
