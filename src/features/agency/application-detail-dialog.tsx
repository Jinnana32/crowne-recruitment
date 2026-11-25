"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  FileText,
  History,
  MapPin,
  StickyNote,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api/browser";
import type { ApplicationView, CandidateView, JobOrderView } from "@/lib/data/demo-store";
import type { DocumentsView } from "@/lib/data/types";
import { PIPELINE_COLUMNS, type ApplicationStage } from "@/lib/domain/stages";
import { cn } from "cn";

const STAGE_OPTIONS: ApplicationStage[] = [...PIPELINE_COLUMNS, "Rejected", "On hold", "Withdrawn"];

export type ApplicationHistoryEntry = {
  id: string;
  previousStage: string | null;
  newStage: string;
  createdAt: string;
  actorName: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatApplied(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function StageBadge({ value }: { value: string }) {
  const selected = value === "Selected";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        selected ? "bg-success-soft text-success" : "bg-royal-soft text-primary",
      )}
    >
      <span className={cn("size-1.5 rounded-full", selected ? "bg-success" : "bg-primary")} />
      {value}
    </span>
  );
}

function DetailSection({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: typeof Briefcase;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Icon className="size-4 text-primary" />
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function InfoRows({ rows }: { rows: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <dl className="grid gap-2.5">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ApplicationDetailDialog({
  application,
  onClose,
  onStage,
  pending,
}: {
  application: ApplicationView | null;
  onClose: () => void;
  onStage: (id: string, stage: ApplicationStage) => void;
  pending: boolean;
}) {
  const open = Boolean(application);
  const candidateId = application?.candidateId;

  const candidates = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => (await api<CandidateView[]>("/api/candidates")).data,
    enabled: open,
  });
  const orders = useQuery({
    queryKey: ["job-orders"],
    queryFn: async () => (await api<JobOrderView[]>("/api/job-orders")).data,
    enabled: open,
  });
  const documents = useQuery({
    queryKey: ["candidate-documents", candidateId],
    queryFn: async () => (await api<DocumentsView>(`/api/candidates/${candidateId}/documents`)).data,
    enabled: open && Boolean(candidateId),
  });
  const history = useQuery({
    queryKey: ["application-history", application?.id],
    queryFn: async () => (await api<ApplicationHistoryEntry[]>(`/api/applications/${application?.id}/history`)).data,
    enabled: open && Boolean(application?.id),
  });

  const candidate = candidates.data?.find((item) => item.id === candidateId) ?? null;
  const order =
    orders.data?.find(
      (item) => item.title === application?.jobTitle && item.employer === application?.employer,
    ) ?? null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        data-application-dialog
        className="flex max-h-[min(92vh,880px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-b border-border px-5 pt-5 pb-4 sm:px-6">
          <DialogTitle className="text-xl font-bold tracking-tight">Application details</DialogTitle>
          <DialogDescription>Review the applicant details and application information.</DialogDescription>
        </DialogHeader>

        {application ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="rounded-2xl border border-border bg-secondary/50 p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-royal-soft text-sm font-bold text-primary">
                  {initials(application.candidateName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-bold">{application.candidateName}</p>
                    <StageBadge value={application.stage} />
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{application.reference}</p>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <li className="inline-flex items-center gap-1.5">
                      <Briefcase className="size-3.5 text-primary/70" />
                      {application.jobTitle}
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary/70" />
                      {application.country}
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-primary/70" />
                      Applied {formatApplied(application.appliedOn)}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Tabs defaultValue="application" className="mt-4 gap-0">
              <TabsList variant="line" className="h-auto w-full justify-start gap-4 rounded-none border-b border-border bg-transparent p-0">
                {[
                  { value: "application", label: "Application", icon: FileText },
                  { value: "profile", label: "Profile snapshot", icon: UserRound },
                  { value: "documents", label: "Documents", icon: FileText },
                  { value: "activity", label: "Activity history", icon: History },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-auto flex-none gap-1.5 rounded-none px-1 pb-2.5 text-sm font-semibold text-muted-foreground shadow-none ring-0 outline-none focus-visible:ring-0 data-active:text-primary group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-0.5 after:rounded-full after:bg-primary"
                  >
                    <tab.icon className="size-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="application" className="mt-4 grid gap-3">
                <DetailSection icon={Briefcase} title="Job information">
                  <InfoRows
                    rows={[
                      { label: "Job order", value: order?.reference ?? "—" },
                      { label: "Position", value: application.jobTitle },
                      { label: "Employer", value: application.employer },
                      { label: "Destination", value: application.country },
                    ]}
                  />
                </DetailSection>
                <DetailSection icon={FileText} title="Application information">
                  <InfoRows
                    rows={[
                      { label: "Application reference", value: <span className="font-mono text-xs sm:text-sm">{application.reference}</span> },
                      { label: "Application date", value: formatApplied(application.appliedOn) },
                      { label: "Source", value: application.source },
                      { label: "Current status", value: <StageBadge value={application.stage} /> },
                    ]}
                  />
                </DetailSection>
                <DetailSection
                  icon={StickyNote}
                  title="Notes"
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => toast.message("Application notes are not available yet.")}
                    >
                      + Add note
                    </Button>
                  }
                >
                  <p className="rounded-lg bg-secondary px-3 py-4 text-sm text-muted-foreground">No notes yet.</p>
                </DetailSection>
              </TabsContent>

              <TabsContent value="profile" className="mt-4">
                <DetailSection icon={UserRound} title="Profile snapshot">
                  {candidates.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading profile…</p>
                  ) : candidate ? (
                    <InfoRows
                      rows={[
                        { label: "Candidate ID", value: candidate.reference },
                        { label: "Email", value: candidate.email || "—" },
                        { label: "Mobile", value: candidate.mobile || "—" },
                        { label: "Nationality", value: candidate.nationality || "—" },
                        { label: "Preferred role", value: candidate.preferredRole || "—" },
                        { label: "Preferred destination", value: candidate.preferredDestination || "—" },
                        { label: "Profile completion", value: `${candidate.profileCompleteness}%` },
                      ]}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Candidate profile could not be loaded.</p>
                  )}
                </DetailSection>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <DetailSection icon={FileText} title="Documents">
                  {documents.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading documents…</p>
                  ) : (documents.data?.documents.length ?? 0) === 0 ? (
                    <p className="rounded-lg bg-secondary px-3 py-4 text-sm text-muted-foreground">No documents recorded for this candidate.</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {documents.data?.documents.map((document) => (
                        <li key={document.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                          <span className="truncate font-medium">{document.name}</span>
                          <span className="rounded-full bg-royal-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                            {document.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </DetailSection>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <DetailSection icon={History} title="Activity history">
                  {history.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading activity…</p>
                  ) : (history.data?.length ?? 0) === 0 ? (
                    <p className="rounded-lg bg-secondary px-3 py-4 text-sm text-muted-foreground">No stage changes recorded yet.</p>
                  ) : (
                    <ol className="grid gap-3">
                      {history.data?.map((entry) => (
                        <li key={entry.id} className="rounded-lg border border-border px-3 py-2.5 text-sm">
                          <p className="font-medium">
                            {entry.previousStage ? (
                              <>
                                {entry.previousStage} → {entry.newStage}
                              </>
                            ) : (
                              <>Opened as {entry.newStage}</>
                            )}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatWhen(entry.createdAt)}
                            {entry.actorName ? ` · ${entry.actorName}` : ""}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </DetailSection>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
          <Link
            href={application ? `/agency/candidates/${application.candidateId}` : "/agency/candidates"}
            className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-1.5")}
          >
            Manage candidate
            <ExternalLink className="size-3.5" />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button type="button" variant="outline" className="h-10 gap-1.5" disabled={!application || pending} />}
              >
                Change status
                <ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {STAGE_OPTIONS.map((stage) => (
                  <DropdownMenuItem
                    key={stage}
                    disabled={!application || stage === application.stage || pending}
                    onClick={() => application && onStage(application.id, stage)}
                  >
                    {stage}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" className="h-10 px-5" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
