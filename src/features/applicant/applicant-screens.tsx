"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { ArrowRight, Briefcase, Check, ClipboardList, Search, SquareCheckBig, UserRound } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/browser";
import type { ApplicationView, CandidateView } from "@/lib/data/demo-store";
import type { ApplicationStage } from "@/lib/domain/stages";
import { APPLICANT_TRACK, activeApplicationCount, applicantTrackIndex, emptyProfileFields } from "@/features/applicant/applicant-state";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  const monthIndex = Number(month) - 1;
  if (!year || !day || monthIndex < 0 || monthIndex > 11) return value;
  return `${months[monthIndex]} ${Number(day)}, ${year}`;
}

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function ApplicationTrack({ stage, appliedOn }: { stage: ApplicationStage; appliedOn: string }) {
  const current = applicantTrackIndex(stage);
  if (current === null) {
    return <p className="text-sm text-muted-foreground">This application is {stage}, so the progress track is not shown as complete.</p>;
  }
  const span = APPLICANT_TRACK.length - 1;
  return (
    <ol className="relative mt-8 grid grid-cols-5">
      <span aria-hidden className="absolute top-3 right-[10%] left-[10%] h-0.5 bg-border" />
      <span aria-hidden className="absolute top-3 left-[10%] h-0.5 bg-primary" style={{ width: `${(current / span) * 80}%` }} />
      {APPLICANT_TRACK.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li key={step.label} className="relative z-10 flex flex-col items-center text-center">
            <span
              className={
                state === "done"
                  ? "grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"
                  : state === "current"
                    ? "grid size-6 place-items-center rounded-full border-[3px] border-primary bg-card"
                    : "size-6 rounded-full border-2 border-border bg-card"
              }
            >
              {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : null}
              {state === "current" ? <span className="size-2 rounded-full bg-primary" /> : null}
            </span>
            <span className={state === "upcoming" ? "mt-2 text-xs text-muted-foreground" : "mt-2 text-xs font-semibold text-primary"}>{step.label}</span>
            {index === 0 ? <span className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(appliedOn)}</span> : null}
            {state === "current" && index !== 0 ? <span className="mt-0.5 text-[11px] font-medium text-primary">In progress</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

function ApplicationCard({ application, detailed }: { application: ApplicationView; detailed?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Card id={`app-${application.id}`} className="scroll-mt-20">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{application.jobTitle} · {application.employer}</CardTitle>
            <CardDescription className="mt-1">Ref: {application.reference} · Applied: {formatDate(application.appliedOn)}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-royal-soft px-3 py-1 text-xs font-semibold text-primary">{application.stage}</span>
            {detailed ? (
              <button type="button" className={buttonVariants({ variant: "outline" })} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
                View details
              </button>
            ) : (
              <Link href={`/applicant/applications#app-${application.id}`} className={buttonVariants({ variant: "outline" })}>View details</Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {detailed ? <ApplicationTrack stage={application.stage} appliedOn={application.appliedOn} /> : null}
        {open ? (
          <p className="text-sm text-muted-foreground">
            {application.country ? `${application.country}. ` : ""}Source: {application.source}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ApplicantDashboard() {
  const applications = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await api<ApplicationView[]>("/api/applications")).data,
  });
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api<CandidateView | null>("/api/profile")).data,
  });

  const records = applications.data ?? [];
  const missing = profile.data ? emptyProfileFields(profile.data) : [];
  const firstName = profile.data?.fullName.trim().split(/\s+/)[0];
  const latest = [...records].sort((left, right) => right.appliedOn.localeCompare(left.appliedOn))[0];
  const loading = applications.isLoading || profile.isLoading;

  const completion = profile.data?.profileCompleteness ?? 0;
  const nextStep = profile.isLoading
    ? "Checking your profile."
    : profile.isError
      ? "Your profile could not be loaded. Refresh the page to try again."
      : missing[0]
        ? `${missing[0].prompt} ${missing.length > 1 ? `${missing.length - 1} more profile ${missing.length - 1 === 1 ? "item is" : "items are"} open after that.` : "It is the last open item on your profile."}`
        : latest
          ? `Your profile is complete. ${latest.jobTitle} is at ${latest.stage}.`
          : "Your profile is complete. Apply for a published job to start an application.";

  return (
    <div className="grid gap-5">
      <header>
        <span aria-hidden className="mb-4 block h-1.5 w-14 rounded-full bg-gold" />
        <h1 className="text-[1.9rem] leading-tight font-bold tracking-tight" suppressHydrationWarning>
          {greetingFor(new Date().getHours())}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Here is an overview of your applications and next steps.</p>
      </header>

      <div data-dash-stats className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Briefcase className="size-5" />} label="Active applications" value={loading ? "—" : String(activeApplicationCount(records.map((item) => item.stage)))} />
        <StatCard icon={<UserRound className="size-5" />} label="Profile completion" value={profile.data ? `${completion}%` : "—"}>
          {profile.data ? <Progress value={completion} className="mt-2.5 h-2" aria-label="Profile completion" /> : null}
        </StatCard>
        <StatCard icon={<SquareCheckBig className="size-5" />} label="Pending actions" value={profile.data ? String(missing.length) : "—"} />
      </div>

      <section data-dash-overview aria-labelledby="overview-title" className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <h2 id="overview-title" className="text-lg font-bold tracking-tight">Application overview</h2>
          <Link href="/applicant/applications" aria-label="View all applications" className="inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-semibold text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
            <span className="sm:hidden">View all</span>
            <span className="hidden sm:inline">View all applications</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="border-t border-border">
          {applications.isLoading ? (
            <div className="m-6 h-12 animate-pulse rounded-lg bg-muted/60" aria-label="Loading applications" />
          ) : applications.isError ? (
            <p className="px-6 py-5 text-sm text-destructive">Your applications could not be loaded. Refresh the page to try again.</p>
          ) : records.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
              <p className="text-sm text-muted-foreground">You have not applied yet. Published jobs are listed under Browse Jobs.</p>
              <Link href="/jobs" className={cn(buttonVariants({ variant: "outline" }), "h-9 bg-card px-4")}>Browse jobs</Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {records.slice(0, 3).map((application) => (
                <li key={application.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-4">
                  <div className="min-w-0">
                    <p className="text-base font-bold">{application.jobTitle} · {application.employer}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">Ref: {application.reference} · Applied: {formatDate(application.appliedOn)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-royal-soft px-3.5 py-1 text-sm font-semibold text-primary">{application.stage}</span>
                    <Link href={`/applicant/applications#app-${application.id}`} className={cn(buttonVariants({ variant: "outline" }), "h-9 bg-card px-4")}>View details</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section data-dash-next aria-labelledby="next-title" className="flex flex-col gap-4 rounded-xl bg-royal-soft p-5 ring-1 ring-primary/10 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-card text-primary shadow-xs">
            <ClipboardList className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="next-title" className="text-lg font-bold tracking-tight">Next step for you</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{nextStep}</p>
          </div>
        </div>
        {profile.data && missing[0] ? (
          <Link href="/applicant/profile" className={cn(buttonVariants(), "h-10 shrink-0 px-5")}>Update my profile</Link>
        ) : profile.data && latest ? (
          <Link href={`/applicant/applications#app-${latest.id}`} className={cn(buttonVariants(), "h-10 shrink-0 px-5")}>View application</Link>
        ) : profile.data ? (
          <Link href="/jobs" className={cn(buttonVariants(), "h-10 shrink-0 px-5")}>Browse jobs</Link>
        ) : null}
      </section>

      <section data-dash-find aria-labelledby="find-title" className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-royal-soft text-primary">
            <Search className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="find-title" className="text-lg font-bold tracking-tight">Find more opportunities</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Explore published job openings and submit a new application.</p>
          </div>
        </div>
        <Link href="/jobs" className={cn(buttonVariants({ variant: "gold" }), "h-10 shrink-0 px-5 font-semibold")}>
          Browse jobs
          <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, children }: { icon: ReactNode; label: string; value: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-royal-soft text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl leading-none font-bold tabular-nums">{value}</p>
        {children}
      </div>
    </div>
  );
}

export function ApplicantApplications() {
  const applications = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await api<ApplicationView[]>("/api/applications")).data,
  });
  const records = [...(applications.data ?? [])].sort((left, right) => right.appliedOn.localeCompare(left.appliedOn));

  return (
    <div>
      <PageHeader
        title="My Applications"
        description="Track the progress of each position you applied for."
        actions={<Link href="/jobs" className={buttonVariants()}>Browse jobs</Link>}
      />
      <QueryState isLoading={applications.isLoading} isError={applications.isError} error={applications.error} isEmpty={records.length === 0} empty="No applications yet.">
        <div className="grid gap-3">
          {records.map((application) => <ApplicationCard key={application.id} application={application} detailed />)}
        </div>
      </QueryState>
    </div>
  );
}
