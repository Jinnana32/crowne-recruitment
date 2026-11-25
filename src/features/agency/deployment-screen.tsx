"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IllustrativeNote } from "@/components/shared/illustrative-note";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import type { DeploymentView } from "@/lib/data/demo-store";

export function DeploymentScreen() {
  const queryClient = useQueryClient();
  const records = useQuery({
    queryKey: ["deployments"],
    queryFn: async () => (await api<DeploymentView[]>("/api/deployments")).data,
  });

  const confirmTicket = useMutation({
    mutationFn: async (id: string) =>
      api<DeploymentView>(`/api/deployments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ travelStatus: "Ticket confirmed" }),
      }),
    onSuccess: async () => {
      toast.success("Travel marked ticket confirmed.");
      await queryClient.invalidateQueries({ queryKey: ["deployments"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Travel status could not be updated."),
  });

  return (
    <div>
      <PageHeader
        kicker="Departure and worker tracking"
        title="Deployment"
        description="Schedule departures from Processing after the checklist is ready. This view does not issue government clearances."
      />
      <QueryState
        isLoading={records.isLoading}
        isError={records.isError}
        error={records.error}
        isEmpty={!records.data?.length}
        empty="No departures are scheduled. Finish processing, mark ready, then schedule a departure date."
      >
        <div className="overflow-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground uppercase">
              <tr>
                {["Worker", "Employer / position", "Destination", "Departure", "Travel", "Readiness", ""].map((heading) => (
                  <th key={heading || "actions"} className="px-3 py-3 font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.data?.map((record) => (
                <tr key={record.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    {record.candidateName}
                    <br />
                    <span className="text-xs text-muted-foreground">{record.reference}</span>
                  </td>
                  <td className="px-3 py-3">
                    {record.employer} · {record.jobTitle}
                  </td>
                  <td className="px-3 py-3">{record.country}</td>
                  <td className="px-3 py-3">{record.departureDate}</td>
                  <td className="px-3 py-3">
                    <StatusBadge value={record.travelStatus} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge value={record.readiness} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    {record.travelStatus !== "Ticket confirmed" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={confirmTicket.isPending}
                        onClick={() => confirmTicket.mutate(record.id)}
                      >
                        Confirm ticket
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
      <IllustrativeNote>
        Scheduling a departure also posts a provisional employer placement fee on Finance for the demo story.
      </IllustrativeNote>
    </div>
  );
}
