"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Download,
  FileText,
  Plane,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api/browser";
import type { ApplicationView, DashboardView } from "@/lib/data/demo-store";
import { formatPeso } from "@/lib/domain/money";
import { PIPELINE_COLUMNS } from "@/lib/domain/stages";
import { cn } from "cn";

type ReportTab = "standard" | "custom" | "scheduled";
type ReportKind = "summary" | "recruitment" | "deployment" | "finance" | "job-orders";

function periodLabel() {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  const format = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" });
  return `${format.format(start)} – ${format.format(end)}`;
}

function downloadCsv(filename: string, lines: string[]) {
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "royal" | "violet" | "gold" | "success";
}) {
  const tile =
    tone === "success"
      ? "bg-success-soft text-success"
      : tone === "gold"
        ? "bg-gold-soft text-primary"
        : tone === "violet"
          ? "bg-[#F0E9FF] text-[#5B4B8A]"
          : "bg-royal-soft text-primary";
  return (
    <article className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-foreground">{value}</p>
        </div>
        <span className={cn("grid size-10 place-items-center rounded-xl", tile)}>
          <Icon className="size-5" />
        </span>
      </div>
      <span className="mt-4 inline-flex items-center rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
        Live count
      </span>
    </article>
  );
}

function ApplicationTrend({
  points,
  total,
}: {
  points: Array<{ label: string; count: number }>;
  total: number;
}) {
  const [active, setActive] = useState(points.length - 1);
  const width = 520;
  const height = 180;
  const padX = 16;
  const padY = 20;
  const max = Math.max(1, ...points.map((point) => point.count));
  const coords = points.map((point, index) => {
    const x = padX + (index / Math.max(points.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - (point.count / max) * (height - padY * 2);
    return { ...point, x, y };
  });
  const line = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${coords.at(-1)?.x ?? padX} ${height - padY} L ${padX} ${height - padY} Z`;
  const current = coords[Math.min(Math.max(active, 0), coords.length - 1)];

  return (
    <article className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-tight">Application Trend</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Cumulative applications by apply date this month</p>
        </div>
        <span className="rounded-full bg-royal-soft px-2.5 py-1 text-[11px] font-semibold text-primary">{total} total</span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label="Application trend chart">
          <defs>
            <linearGradient id="crowne-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#141E68" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#141E68" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#crowne-trend-fill)" />
          <path d={line} fill="none" stroke="#141E68" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map((point, index) => (
            <circle
              key={point.label}
              cx={point.x}
              cy={point.y}
              r={index === active ? 5 : 3.5}
              fill="#141E68"
              className="cursor-pointer"
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              tabIndex={0}
            />
          ))}
        </svg>
        {current ? (
          <div
            className="pointer-events-none absolute rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm"
            style={{
              left: `clamp(0px, calc(${(current.x / width) * 100}% - 40px), calc(100% - 88px))`,
              top: Math.max(8, (current.y / height) * 176 - 36),
            }}
          >
            {current.count} applications
            <p className="font-medium text-white/70">{current.label}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        {points.filter((_, index) => index % Math.ceil(points.length / 5) === 0 || index === points.length - 1).map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </article>
  );
}

function PipelineBars({ stages }: { stages: Array<{ stage: string; count: number }> }) {
  const max = Math.max(1, ...stages.map((item) => item.count));
  const tones = ["bg-[#141E68]", "bg-[#2A3A8F]", "bg-[#4A5BA8]", "bg-[#7B88C4]", "bg-[#B4BDE0]"];
  return (
    <article className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border sm:p-6">
      <h2 className="text-sm font-bold tracking-tight">Recruitment Pipeline</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Applications in each board stage</p>
      <ul className="mt-5 grid gap-3">
        {stages.map((item, index) => (
          <li key={item.stage}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-muted-foreground">{item.stage}</span>
              <span className="font-semibold tabular-nums text-foreground">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-royal-soft">
              <div
                className={cn("h-full rounded-full transition-[width] duration-500", tones[index] ?? "bg-primary")}
                style={{ width: `${item.count === 0 ? 0 : Math.max(8, Math.round((item.count / max) * 100))}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function JobOrderDonut({
  slices,
  total,
}: {
  slices: Array<{ label: string; count: number; color: string }>;
  total: number;
}) {
  const radius = 54;
  const stroke = 18;
  const circumference = 2 * Math.PI * radius;
  const segments = slices.reduce<Array<{ label: string; color: string; length: number; offset: number }>>((acc, slice) => {
    const length = total === 0 ? 0 : (slice.count / total) * circumference;
    const offset = acc.reduce((sum, item) => sum + item.length, 0);
    acc.push({ label: slice.label, color: slice.color, length, offset });
    return acc;
  }, []);
  return (
    <article className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border sm:p-6">
      <h2 className="text-sm font-bold tracking-tight">Application by Job Order</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Share of applications by role and destination</p>
      <div className="mt-4 flex flex-col items-center gap-4">
        <div className="relative grid place-items-center">
          <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90" role="img" aria-label="Applications by job order">
            <circle cx="74" cy="74" r={radius} fill="none" stroke="#EDF1FF" strokeWidth={stroke} />
            {segments.map((segment) => (
              <circle
                key={segment.label}
                cx="74"
                cy="74"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute text-center">
            <p className="text-2xl font-bold tabular-nums text-foreground">{total}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Applications</p>
          </div>
        </div>
        <ul className="grid w-full gap-2">
          {slices.length === 0 ? (
            <li className="text-xs text-muted-foreground">No applications yet.</li>
          ) : (
            slices.map((slice) => (
              <li key={slice.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: slice.color }} />
                  <span className="truncate text-muted-foreground">{slice.label}</span>
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {total === 0 ? 0 : Math.round((slice.count / total) * 100)}%
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </article>
  );
}

const STANDARD_REPORTS: Array<{
  kind: Exclude<ReportKind, "summary">;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    kind: "recruitment",
    title: "Recruitment Report",
    description: "Application, screening, and selection performance.",
    icon: FileText,
    tone: "bg-[#F0E9FF] text-[#5B4B8A]",
  },
  {
    kind: "deployment",
    title: "Deployment Report",
    description: "Departures, deployment readiness, and processing summary.",
    icon: Plane,
    tone: "bg-royal-soft text-primary",
  },
  {
    kind: "finance",
    title: "Finance Report",
    description: "Recorded income, expenses, and financial summary.",
    icon: CircleDollarSign,
    tone: "bg-success-soft text-success",
  },
  {
    kind: "job-orders",
    title: "Job Order Report",
    description: "Job orders, vacancies, and fulfillment status.",
    icon: Briefcase,
    tone: "bg-gold-soft text-primary",
  },
];

export function ReportsScreen() {
  const [tab, setTab] = useState<ReportTab>("standard");
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api<DashboardView>("/api/dashboard")).data,
  });
  const applications = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await api<ApplicationView[]>("/api/applications")).data,
  });

  const data = dashboard.data;
  const apps = useMemo(() => applications.data ?? [], [applications.data]);

  const trend = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDay = new Map<string, number>();
    for (const app of apps) {
      const date = new Date(`${app.appliedOn}T12:00:00`);
      if (date.getFullYear() !== year || date.getMonth() !== month) continue;
      const key = app.appliedOn;
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    let running = 0;
    const points: Array<{ label: string; count: number }> = [];
    const format = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      running += byDay.get(iso) ?? 0;
      if (day === 1 || day === daysInMonth || day % 7 === 1 || day === now.getDate()) {
        points.push({ label: format.format(new Date(year, month, day)), count: running });
      }
    }
    if (points.length === 0) {
      return [{ label: format.format(now), count: apps.length }];
    }
    return points;
  }, [apps]);

  const jobSlices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const app of apps) {
      const label = `${app.jobTitle} · ${app.country}`;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const colors = ["#141E68", "#4A5BA8", "#8B97C9", "#B4BDE0", "#D7DCF0"];
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count], index) => ({ label, count, color: colors[index] ?? "#141E68" }));
  }, [apps]);

  const pipeline = useMemo(() => {
    if (!data) return PIPELINE_COLUMNS.map((stage) => ({ stage, count: 0 }));
    return PIPELINE_COLUMNS.map((stage) => ({
      stage,
      count: data.stageCounts.find((item) => item.stage === stage)?.count ?? 0,
    }));
  }, [data]);

  function exportReport(kind: ReportKind) {
    if (!data) return;
    if (kind === "summary") {
      downloadCsv("crowne-report-summary.csv", [
        "metric,value",
        `applicants,${data.applicants}`,
        `applications,${data.applications}`,
        `shortlisted,${data.shortlisted}`,
        `selected,${data.selected}`,
        `job_orders,${data.jobOrders}`,
        `vacancies,${data.vacancies}`,
        `processing,${data.processing}`,
        `ready_for_deployment,${data.readyForDeployment}`,
        `deployments,${data.deployments}`,
        `income_cents,${data.incomeCents}`,
        `expense_cents,${data.expenseCents}`,
        `pending_finance_approvals,${data.pendingApprovals}`,
      ]);
      toast.success("Summary report exported.");
      return;
    }
    if (kind === "recruitment") {
      downloadCsv("crowne-report-recruitment.csv", [
        "metric,value",
        `applicants,${data.applicants}`,
        `applications,${data.applications}`,
        `shortlisted,${data.shortlisted}`,
        `selected,${data.selected}`,
        ...pipeline.map((item) => `stage_${item.stage.replaceAll(" ", "_").toLowerCase()},${item.count}`),
      ]);
      toast.success("Recruitment report exported.");
      return;
    }
    if (kind === "deployment") {
      downloadCsv("crowne-report-deployment.csv", [
        "metric,value",
        `processing,${data.processing}`,
        `ready_for_deployment,${data.readyForDeployment}`,
        `deployments,${data.deployments}`,
        `selected,${data.selected}`,
      ]);
      toast.success("Deployment report exported.");
      return;
    }
    if (kind === "finance") {
      downloadCsv("crowne-report-finance.csv", [
        "metric,value",
        `income_cents,${data.incomeCents}`,
        `expense_cents,${data.expenseCents}`,
        `net_cents,${data.incomeCents - data.expenseCents}`,
        `pending_finance_approvals,${data.pendingApprovals}`,
        `income_label,${formatPeso(data.incomeCents)}`,
        `expense_label,${formatPeso(data.expenseCents)}`,
      ]);
      toast.success("Finance report exported.");
      return;
    }
    downloadCsv("crowne-report-job-orders.csv", [
      "metric,value",
      `job_orders,${data.jobOrders}`,
      `vacancies,${data.vacancies}`,
      `selected,${data.selected}`,
      ...jobSlices.map((slice) => `applications_${slice.label.replaceAll(/[^a-zA-Z0-9]+/g, "_").toLowerCase()},${slice.count}`),
    ]);
    toast.success("Job order report exported.");
  }

  const tabs: Array<{ id: ReportTab; label: string }> = [
    { id: "standard", label: "Standard Reports" },
    { id: "custom", label: "Custom Reports" },
    { id: "scheduled", label: "Scheduled Reports" },
  ];

  return (
    <div data-reports>
      <PageHeader
        kicker="Management reporting"
        title="Reports"
        description="Track recruitment performance, deployment progress, and financial summary."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span
              title="Date range filtering is illustrative for this period."
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground"
            >
              <CalendarDays className="size-4" />
              {periodLabel()}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button type="button" className="h-10 gap-1.5" disabled={!data} />}
              >
                <Download className="size-4" />
                Export Report
                <ChevronDown className="size-4 opacity-80" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportReport("summary")}>Summary CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportReport("recruitment")}>Recruitment CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportReport("deployment")}>Deployment CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportReport("finance")}>Finance CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportReport("job-orders")}>Job order CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <QueryState isLoading={dashboard.isLoading || applications.isLoading} isError={dashboard.isError} error={dashboard.error}>
        {data ? (
          <div className="grid gap-5">
            <section data-reports-kpis className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Applicants" value={data.applicants} icon={Users} tone="royal" />
              <MetricCard label="Applications" value={data.applications} icon={FileText} tone="violet" />
              <MetricCard label="Shortlisted" value={data.shortlisted} icon={Bookmark} tone="gold" />
              <MetricCard label="Selected" value={data.selected} icon={CheckCircle2} tone="success" />
            </section>

            <section data-reports-charts className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr_0.85fr]">
              <ApplicationTrend points={trend} total={data.applications} />
              <PipelineBars stages={pipeline} />
              <JobOrderDonut slices={jobSlices} total={apps.length} />
            </section>

            <section data-reports-catalog className="rounded-2xl bg-card shadow-xs ring-1 ring-border">
              <div className="border-b border-border px-4 pt-3 sm:px-5">
                <div className="flex gap-4 overflow-x-auto">
                  {tabs.map((item) => {
                    const active = tab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className={cn(
                          "relative shrink-0 pb-3 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {item.label}
                        {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {tab === "standard" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {STANDARD_REPORTS.map((report) => {
                      const Icon = report.icon;
                      return (
                        <article
                          key={report.kind}
                          className="flex flex-col gap-4 rounded-xl bg-secondary/40 p-4 ring-1 ring-border/70 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", report.tone)}>
                              <Icon className="size-5" />
                            </span>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground">{report.title}</h3>
                              <p className="mt-0.5 text-sm text-muted-foreground">{report.description}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 shrink-0 gap-1.5 bg-card"
                            onClick={() => exportReport(report.kind)}
                          >
                            <Download className="size-4" />
                            Generate
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                ) : tab === "custom" ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Custom report builders are not configured yet. Use a standard report export for now.
                  </p>
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Scheduled report delivery is not available yet. Export a standard report when you need a snapshot.
                  </p>
                )}
              </div>
            </section>

            <p className="text-xs text-muted-foreground">{data.fulfillmentNote}</p>
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
