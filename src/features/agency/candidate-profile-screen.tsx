"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  Briefcase,
  Check,
  ChevronDown,
  Download,
  Ellipsis,
  FileText,
  GraduationCap,
  Languages,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApplicationHistoryEntry } from "@/features/agency/application-detail-dialog";
import { CandidateDocumentsPanel } from "@/features/agency/candidate-documents-panel";
import { formatPeriod } from "@/features/applicant/profile-entries";
import { api } from "@/lib/api/browser";
import type { ApplicationView, CandidateView, JobOrderView } from "@/lib/data/demo-store";
import type { EducationEntry, WorkExperienceEntry } from "@/lib/data/types";
import { PIPELINE_COLUMNS, type ApplicationStage } from "@/lib/domain/stages";
import { cn } from "cn";

const STAGE_OPTIONS: ApplicationStage[] = [...PIPELINE_COLUMNS, "Rejected", "On hold", "Withdrawn"];

const tabClass =
  "h-auto flex-none gap-1.5 rounded-none px-1 pb-2.5 text-sm font-semibold text-muted-foreground shadow-none ring-0 outline-none focus-visible:ring-0 data-active:text-primary group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-0.5 after:rounded-full after:bg-primary";

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

function Card({ title, icon: Icon, children, className }: { title: string; icon: typeof Briefcase; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border", className)}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
        <Icon className="size-4 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoRows({ rows }: { rows: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid gap-2.5">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 text-sm sm:grid-cols-[8.5rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PipelineStepper({ stage }: { stage: ApplicationStage }) {
  const index = PIPELINE_COLUMNS.indexOf(stage as (typeof PIPELINE_COLUMNS)[number]);
  return (
    <ol className="grid gap-3">
      {PIPELINE_COLUMNS.map((step, stepIndex) => {
        const done = index >= 0 && stepIndex < index;
        const active = step === stage;
        return (
          <li key={step} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                active ? "bg-success text-white" : done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              {done || active ? <Check className="size-3.5" /> : stepIndex + 1}
            </span>
            <span className={cn(active ? "font-semibold text-success" : done ? "font-medium text-foreground" : "text-muted-foreground")}>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function CandidateProfileScreen({ candidateId }: { candidateId: string }) {
  const queryClient = useQueryClient();
  const candidate = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: async () => (await api<CandidateView>(`/api/candidates/${candidateId}`)).data,
  });
  const applications = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await api<ApplicationView[]>("/api/applications")).data,
  });
  const work = useQuery({
    queryKey: ["candidate-work", candidateId],
    queryFn: async () => (await api<WorkExperienceEntry[]>(`/api/candidates/${candidateId}/work-experience`)).data,
  });
  const education = useQuery({
    queryKey: ["candidate-education", candidateId],
    queryFn: async () => (await api<EducationEntry[]>(`/api/candidates/${candidateId}/education`)).data,
  });
  const orders = useQuery({
    queryKey: ["job-orders"],
    queryFn: async () => (await api<JobOrderView[]>("/api/job-orders")).data,
  });

  const ownApplications = (applications.data ?? []).filter((item) => item.candidateId === candidateId);
  const latest = [...ownApplications].sort((a, b) => b.appliedOn.localeCompare(a.appliedOn))[0] ?? null;
  const order =
    latest && orders.data
      ? orders.data.find((item) => item.title === latest.jobTitle && item.employer === latest.employer) ?? null
      : null;

  const history = useQuery({
    queryKey: ["application-history", latest?.id],
    queryFn: async () => (await api<ApplicationHistoryEntry[]>(`/api/applications/${latest?.id}/history`)).data,
    enabled: Boolean(latest?.id),
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; stage: ApplicationStage }) =>
      api(`/api/applications/${input.id}`, { method: "PATCH", body: JSON.stringify({ stage: input.stage }) }),
    onSuccess: async (_data, input) => {
      toast.success(`Moved to ${input.stage}.`);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["processing"] });
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
      await queryClient.invalidateQueries({ queryKey: ["application-history", input.id] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The stage could not be updated."),
  });

  const downloadCv = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/candidates/${candidateId}/cv`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(body?.error?.message ?? "The CV could not be downloaded.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match?.[1] ?? "CV.pdf";
      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The CV could not be downloaded."),
  });

  const languages = (candidate.data?.languages ?? "")
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div data-candidate-profile>
      <div className="mb-4 text-xs font-medium text-muted-foreground">
        <Link href="/agency/candidates" className="hover:text-primary hover:underline">Candidates</Link>
        <span className="mx-1.5">›</span>
        <span>Manage candidate</span>
      </div>

      <QueryState isLoading={candidate.isLoading} isError={candidate.isError} error={candidate.error}>
        {candidate.data ? (
          <>
            <PageHeader
              kicker="People database"
              title="Candidate profile"
              description="View the candidate profile, applications, and documents."
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 gap-1.5"
                    disabled={downloadCv.isPending}
                    aria-busy={downloadCv.isPending}
                    onClick={() => downloadCv.mutate()}
                  >
                    {downloadCv.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Download className="size-4" aria-hidden />
                    )}
                    {downloadCv.isPending ? "Preparing CV…" : "Download CV"}
                  </Button>
                  <Button type="button" variant="outline" className="h-10 gap-1.5" onClick={() => toast.message("Staff profile editing is not available yet.")}>
                    <Pencil className="size-4" />
                    Edit profile
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button type="button" variant="outline" size="icon" className="size-10" aria-label="More actions" />}>
                      <Ellipsis className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.message("Messaging is not available yet.")}>Send message</DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/agency/recruitment" />}>Open recruitment board</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              }
            />

            <section data-candidate-hero className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-16 shrink-0 place-items-center rounded-full bg-royal-soft text-lg font-bold text-primary">
                    {initials(candidate.data.fullName)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold tracking-tight">{candidate.data.fullName}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {candidate.data.preferredRole || "Role not set"}
                      {candidate.data.reference ? ` · ${candidate.data.reference}` : ""}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                      {candidate.data.mobile ? (
                        <li className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5 text-primary/70" />
                          {candidate.data.mobile}
                        </li>
                      ) : null}
                      {candidate.data.email ? (
                        <li className="inline-flex items-center gap-1.5">
                          <Mail className="size-3.5 text-primary/70" />
                          {candidate.data.email}
                        </li>
                      ) : null}
                      {candidate.data.nationality || candidate.data.preferredDestination ? (
                        <li className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-primary/70" />
                          {candidate.data.nationality || candidate.data.preferredDestination}
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                  {latest ? <StageBadge value={latest.stage} /> : <StageBadge value={candidate.data.status} />}
                  {latest ? (
                    <>
                      <p className="font-mono text-xs text-muted-foreground">{latest.reference}</p>
                      <p className="text-xs text-muted-foreground">Applied {formatApplied(latest.appliedOn)}</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No applications yet</p>
                  )}
                </div>
              </div>
            </section>

            <Tabs defaultValue="overview" className="mt-5 gap-0">
              <TabsList variant="line" className="h-auto w-full justify-start gap-4 rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger value="overview" className={tabClass}>Overview</TabsTrigger>
                <TabsTrigger value="application" className={tabClass}>Application</TabsTrigger>
                <TabsTrigger value="documents" className={tabClass}>Documents</TabsTrigger>
                <TabsTrigger value="history" className={tabClass}>History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-5">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="grid gap-5">
                    <Card title="Professional summary" icon={FileText}>
                      {candidate.data.experience?.trim() || candidate.data.preferredRole ? (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {candidate.data.experience?.trim() ||
                            `${candidate.data.fullName} is interested in ${candidate.data.preferredRole}${candidate.data.preferredDestination ? ` roles in ${candidate.data.preferredDestination}` : ""}.`}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No professional summary recorded.</p>
                      )}
                    </Card>

                    <Card title="Work experience" icon={Briefcase}>
                      {work.isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading…</p>
                      ) : (work.data?.length ?? 0) === 0 ? (
                        <p className="text-sm text-muted-foreground">No work experience entries yet.</p>
                      ) : (
                        <ul className="grid gap-4">
                          {work.data?.map((entry) => (
                            <li key={entry.id} className="border-l-2 border-primary/20 pl-4">
                              <p className="font-semibold">{entry.jobTitle}</p>
                              <p className="text-sm text-muted-foreground">
                                {entry.employerName}
                                {entry.country ? ` · ${entry.country}` : ""}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{formatPeriod(entry)}</p>
                              {entry.description ? (
                                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{entry.description}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>

                    <Card title="Education" icon={GraduationCap}>
                      {education.isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading…</p>
                      ) : (education.data?.length ?? 0) === 0 ? (
                        candidate.data.education?.trim() ? (
                          <p className="text-sm text-muted-foreground">{candidate.data.education}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No education entries yet.</p>
                        )
                      ) : (
                        <ul className="grid gap-4">
                          {education.data?.map((entry) => (
                            <li key={entry.id} className="border-l-2 border-primary/20 pl-4">
                              <p className="font-semibold">{entry.qualification}</p>
                              <p className="text-sm text-muted-foreground">
                                {entry.school}
                                {entry.fieldOfStudy ? ` · ${entry.fieldOfStudy}` : ""}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{formatPeriod(entry)}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>

                    <Card title="Languages" icon={Languages}>
                      {languages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No languages recorded.</p>
                      ) : (
                        <ul className="flex flex-wrap gap-2">
                          {languages.map((language) => (
                            <li key={language} className="rounded-full bg-royal-soft px-3 py-1 text-xs font-semibold text-primary">
                              {language}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  </div>

                  <aside className="grid gap-5 self-start">
                    <Card title="Application overview" icon={Briefcase}>
                      {latest ? (
                        <InfoRows
                          rows={[
                            { label: "Job order", value: order?.reference ?? "—" },
                            { label: "Position", value: latest.jobTitle },
                            { label: "Employer", value: latest.employer },
                            { label: "Destination", value: latest.country },
                          ]}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">No application on file.</p>
                      )}
                    </Card>

                    {latest && PIPELINE_COLUMNS.includes(latest.stage as (typeof PIPELINE_COLUMNS)[number]) ? (
                      <Card title="Recruitment status" icon={Check}>
                        <PipelineStepper stage={latest.stage} />
                      </Card>
                    ) : latest ? (
                      <Card title="Recruitment status" icon={Check}>
                        <StageBadge value={latest.stage} />
                      </Card>
                    ) : null}

                    <Card title="Quick actions" icon={StickyNote}>
                      <div className="grid gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button type="button" variant="outline" className="h-10 w-full justify-between" disabled={!latest || update.isPending} />}
                          >
                            Change status
                            <ChevronDown className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            {STAGE_OPTIONS.map((stage) => (
                              <DropdownMenuItem
                                key={stage}
                                disabled={!latest || stage === latest.stage || update.isPending}
                                onClick={() => latest && update.mutate({ id: latest.id, stage })}
                              >
                                {stage}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button type="button" variant="outline" className="h-10" onClick={() => toast.message("Application notes are not available yet.")}>
                          Add note
                        </Button>
                        <Button type="button" variant="outline" className="h-10" onClick={() => toast.message("Messaging is not available yet.")}>
                          Send message
                        </Button>
                        {latest ? (
                          <Link href="/agency/recruitment" className={cn(buttonVariants(), "h-10")}>
                            Open in pipeline
                          </Link>
                        ) : null}
                      </div>
                    </Card>
                  </aside>
                </div>
              </TabsContent>

              <TabsContent value="application" className="mt-5 grid gap-4">
                {ownApplications.length === 0 ? (
                  <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-xs ring-1 ring-border">No applications for this candidate.</p>
                ) : (
                  ownApplications.map((application) => (
                    <article key={application.id} className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{application.jobTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            {application.employer} · {application.country}
                          </p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">{application.reference}</p>
                        </div>
                        <StageBadge value={application.stage} />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Applied {formatApplied(application.appliedOn)} · {application.source}
                      </p>
                    </article>
                  ))
                )}
              </TabsContent>

              <TabsContent value="documents" className="mt-5">
                <CandidateDocumentsPanel candidateId={candidateId} />
              </TabsContent>

              <TabsContent value="history" className="mt-5">
                <Card title="Activity history" icon={FileText}>
                  {!latest ? (
                    <p className="text-sm text-muted-foreground">No application history yet.</p>
                  ) : history.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : (history.data?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No stage changes recorded yet.</p>
                  ) : (
                    <ol className="grid gap-3">
                      {history.data?.map((entry) => (
                        <li key={entry.id} className="rounded-xl border border-border px-3 py-2.5 text-sm">
                          <p className="font-medium">
                            {entry.previousStage ? `${entry.previousStage} → ${entry.newStage}` : `Opened as ${entry.newStage}`}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatApplied(entry.createdAt)}
                            {entry.actorName ? ` · ${entry.actorName}` : ""}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
