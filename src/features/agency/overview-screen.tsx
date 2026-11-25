"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Plus,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import type { DashboardView, JobOrderView } from "@/lib/data/demo-store";
import { formatPeso } from "@/lib/domain/money";
import { cn } from "cn";

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "royal",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "royal" | "success" | "warning";
}) {
  const tile =
    tone === "success"
      ? "bg-success-soft text-success"
      : tone === "warning"
        ? "bg-warning-soft text-warning"
        : "bg-royal-soft text-primary";
  return (
    <article data-overview-stat className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-xs ring-1 ring-border sm:p-5">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tile)}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-foreground">{value}</p>
      </div>
    </article>
  );
}

function RecruitingBadge({ value }: { value: string }) {
  const recruiting = value === "Recruiting";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        recruiting ? "bg-success-soft text-success" : "bg-royal-soft text-primary",
      )}
    >
      <span className={cn("size-1.5 rounded-full", recruiting ? "bg-success" : "bg-primary")} />
      {value}
    </span>
  );
}

function PriorityOrder({ order }: { order: JobOrderView }) {
  return (
    <li data-overview-order className="flex flex-col gap-3 rounded-xl bg-secondary/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-primary ring-1 ring-border">
          <Briefcase className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{order.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{order.employer}</p>
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{order.reference}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
        <RecruitingBadge value={order.status} />
        <Link href="/agency/job-orders" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          View job order
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </li>
  );
}

export function OverviewScreen() {
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api<DashboardView>("/api/dashboard")).data,
  });
  const data = dashboard.data;
  const maxStage = Math.max(1, ...(data?.stageCounts.map((stage) => stage.count) ?? [1]));

  return (
    <div data-overview>
      <PageHeader
        kicker="Agency operations"
        title="Overview"
        description="Counts on this page come from the current records."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span
              title="Date range filtering is not available yet."
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground"
            >
              <CalendarDays className="size-4" />
              All time
            </span>
            <Link href="/agency/job-orders" className={cn(buttonVariants(), "h-10 gap-1.5 px-4")}>
              <Plus className="size-4" />
              Create job order
            </Link>
          </div>
        }
      />

      <QueryState isLoading={dashboard.isLoading} isError={dashboard.isError} error={dashboard.error}>
        {data ? (
          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Applicants" value={String(data.applicants)} icon={Users} />
              <StatCard label="Applications" value={String(data.applications)} icon={FileText} />
              <StatCard label="Shortlisted" value={String(data.shortlisted)} icon={Bookmark} />
              <StatCard label="Selected" value={String(data.selected)} icon={CheckCircle2} tone="success" />
              <StatCard label="In processing" value={String(data.processing)} icon={Clock3} />
              <StatCard label="Ready to deploy" value={String(data.readyForDeployment)} icon={CheckCircle2} tone="success" />
              <StatCard label="Departures" value={String(data.deployments)} icon={Briefcase} />
              <StatCard label="Pending finance review" value={String(data.pendingApprovals)} icon={Receipt} tone="warning" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section data-overview-pipeline className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-bold tracking-tight">Recruitment pipeline</h2>
                  <Link href="/agency/recruitment" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
                    View recruitment
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                <ul className="mt-5 grid gap-4">
                  {data.stageCounts.map((stage) => {
                    const width = Math.round((stage.count / maxStage) * 100);
                    return (
                      <li key={stage.stage}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">{stage.stage}</span>
                          <span className="font-semibold tabular-nums text-foreground">{stage.count}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-royal-soft">
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-500"
                            style={{ width: `${stage.count === 0 ? 0 : Math.max(width, 8)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section data-overview-priority className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border sm:p-6">
                <h2 className="text-base font-bold tracking-tight">Priority job orders</h2>
                {data.priorityJobOrders.length === 0 ? (
                  <p className="mt-5 text-sm text-muted-foreground">No recruiting job orders yet.</p>
                ) : (
                  <ul className="mt-5 grid gap-3">
                    {data.priorityJobOrders.map((order) => (
                      <PriorityOrder key={order.id} order={order} />
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section data-overview-finance>
              <h2 className="mb-3 text-base font-bold tracking-tight">Financial snapshot</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Recorded income" value={formatPeso(data.incomeCents)} icon={CircleDollarSign} tone="success" />
                <StatCard label="Recorded expenses" value={formatPeso(data.expenseCents)} icon={Receipt} tone="warning" />
                <StatCard
                  label="Net recorded"
                  value={formatPeso(data.incomeCents - data.expenseCents)}
                  icon={CircleDollarSign}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Medical pass and scheduled departure post provisional demo transactions on Finance. Counts above stay linked to the same live records.
              </p>
            </section>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <span aria-hidden className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-royal-soft text-[10px] font-bold text-primary">
                i
              </span>
              {data.fulfillmentNote}
            </p>
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
