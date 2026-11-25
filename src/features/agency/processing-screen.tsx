"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IllustrativeNote } from "@/components/shared/illustrative-note";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/browser";
import type { ProcessingView } from "@/lib/data/demo-store";
import type { ChecklistItem } from "@/lib/data/types";
import { nextChecklistState } from "@/lib/domain/processing";
import { cn } from "cn";

export function ProcessingScreen() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [departureDate, setDepartureDate] = useState("");

  const records = useQuery({
    queryKey: ["processing"],
    queryFn: async () => (await api<ProcessingView[]>("/api/processing")).data,
  });

  const selected =
    records.data?.find((item) => item.id === selectedId) ??
    records.data?.[0] ??
    null;

  async function invalidateFlow() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["processing"] }),
      queryClient.invalidateQueries({ queryKey: ["deployments"] }),
      queryClient.invalidateQueries({ queryKey: ["finance"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["applications"] }),
    ]);
  }

  const updateItem = useMutation({
    mutationFn: async (input: { id: string; label: string; state: ChecklistItem["state"] }) =>
      api<ProcessingView>(`/api/processing/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({ label: input.label, state: input.state }),
      }),
    onSuccess: async () => {
      toast.success("Checklist updated.");
      await invalidateFlow();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The checklist could not be updated."),
  });

  const markReady = useMutation({
    mutationFn: async (id: string) =>
      api<ProcessingView>(`/api/processing/${id}`, { method: "PATCH", body: JSON.stringify({ markReady: true }) }),
    onSuccess: async () => {
      toast.success("Marked ready for deployment.");
      await invalidateFlow();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not mark ready."),
  });

  const schedule = useMutation({
    mutationFn: async (input: { processingId: string; departureDate: string }) =>
      api("/api/deployments", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async () => {
      toast.success("Departure scheduled. Check Deployment and Finance.");
      setDepartureDate("");
      await invalidateFlow();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Departure could not be scheduled."),
  });

  return (
    <div>
      <PageHeader
        kicker="Post-selection workflow"
        title="Processing"
        description="Selected applications open a checklist here. Finish every item, mark ready, then schedule departure."
      />
      <QueryState
        isLoading={records.isLoading}
        isError={records.isError}
        error={records.error}
        isEmpty={records.data?.length === 0}
        empty="No selected applications are in processing. Move a candidate to Selected on the recruitment board."
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-xs text-muted-foreground uppercase">
                <tr>
                  {["Candidate", "Job", "Checklist", "Next action", "Status"].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.data?.map((record) => {
                  const active = record.id === selected?.id;
                  return (
                    <tr
                      key={record.id}
                      className={cn("border-t border-border cursor-pointer", active && "bg-royal-soft/50")}
                      onClick={() => setSelectedId(record.id)}
                    >
                      <td className="px-3 py-3">
                        <strong>{record.candidateName}</strong>
                        <br />
                        <span className="text-xs text-muted-foreground">{record.reference}</span>
                      </td>
                      <td className="px-3 py-3">
                        {record.jobTitle} · {record.country}
                      </td>
                      <td className="px-3 py-3">{record.completionPercent}%</td>
                      <td className="px-3 py-3">{record.nextAction}</td>
                      <td className="px-3 py-3">
                        <StatusBadge value={record.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <aside className="rounded-xl border border-border bg-card p-4">
            {selected ? (
              <>
                <h2 className="font-semibold">Checklist</h2>
                <p className="text-xs text-muted-foreground">
                  {selected.candidateName} · {selected.reference}
                </p>
                <div className="mt-3 divide-y divide-border">
                  {selected.checklist.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span>{item.label}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={selected.status === "Ready" || updateItem.isPending}
                        onClick={() =>
                          updateItem.mutate({
                            id: selected.id,
                            label: item.label,
                            state: nextChecklistState(item.label, item.state),
                          })
                        }
                      >
                        <StatusBadge value={item.state} />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Medical stays status-only here. Passing medical records a provisional expense on Finance.
                </p>
                <div className="mt-4 grid gap-3">
                  {selected.status !== "Ready" ? (
                    <Button
                      type="button"
                      disabled={markReady.isPending || selected.completionPercent < 100}
                      onClick={() => markReady.mutate(selected.id)}
                    >
                      {markReady.isPending ? "Marking…" : "Mark ready for deployment"}
                    </Button>
                  ) : selected.hasDeployment ? (
                    <Link href="/agency/deployment" className={cn(buttonVariants({ variant: "outline" }), "justify-center")}>
                      View on Deployment
                    </Link>
                  ) : (
                    <div className="grid gap-2 rounded-lg bg-secondary/60 p-3">
                      <Label htmlFor="departure-date">Departure date</Label>
                      <Input
                        id="departure-date"
                        type="date"
                        value={departureDate}
                        onChange={(event) => setDepartureDate(event.target.value)}
                        className="h-10 bg-card"
                      />
                      <Button
                        type="button"
                        disabled={!departureDate || schedule.isPending}
                        onClick={() => schedule.mutate({ processingId: selected.id, departureDate })}
                      >
                        {schedule.isPending ? "Scheduling…" : "Schedule departure"}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a processing record.</p>
            )}
          </aside>
        </div>
      </QueryState>
      <IllustrativeNote>
        Checklist items are a provisional Middle East sample. Country and employer rules still need confirmation from Crowne.
      </IllustrativeNote>
    </div>
  );
}
