"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Briefcase, Check, HeartPulse, MapPin, Search, UserPlus, Wrench } from "lucide-react";
import { QueryState } from "@/components/shared/query-state";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/browser";
import type { Actor } from "@/lib/auth/session";
import type { PublicJob } from "@/lib/data/demo-store";
import { MIDDLE_EAST_COUNTRIES } from "@/lib/domain/countries";
import { cn } from "cn";

const DESTINATIONS = [...MIDDLE_EAST_COUNTRIES];
const CATEGORIES = ["Construction", "Healthcare", "Engineering", "Hospitality"];
const PREVIEW_LIMIT = 5;

const STEPS = [
  "Create your applicant account",
  "Complete your profile",
  "Submit job applications",
  "Track your application status",
];

function CategoryIcon({ category, className }: { category: string; className: string }) {
  const value = category.toLowerCase();
  if (value.includes("health") || value.includes("care")) return <HeartPulse className={className} />;
  if (value.includes("engineer") || value.includes("construct")) return <Wrench className={className} />;
  return <Briefcase className={className} />;
}

function blurb(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Open the listing for role details, requirements, and how to apply.";
  return cleaned.length > 140 ? `${cleaned.slice(0, 137).trimEnd()}…` : cleaned;
}

const fieldClass =
  "h-11 w-full rounded-lg border-0 bg-transparent px-0 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0";

function buildJobsHref(path: "/jobs" | "/jobs/all", params: { query: string; country: string; category: string }) {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.country) search.set("country", params.country);
  if (params.category) search.set("category", params.category);
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

function useJobsFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("query") ?? "";
  const country = params.get("country") ?? "";
  const category = params.get("category") ?? "";

  function update(next: { query?: string; country?: string; category?: string }, path: "/jobs" | "/jobs/all") {
    router.replace(buildJobsHref(path, { query, country, category, ...next }));
  }

  const jobs = useQuery({
    queryKey: ["jobs", { query, country, category }],
    queryFn: async () => {
      const search = new URLSearchParams({ query, country, category });
      return (await api<PublicJob[]>(`/api/jobs?${search.toString()}`)).data;
    },
  });

  return { query, country, category, update, jobs };
}

function JobsHero({
  query,
  country,
  category,
  onUpdate,
  path,
  title,
  subtitle,
}: {
  query: string;
  country: string;
  category: string;
  onUpdate: (next: { query?: string; country?: string; category?: string }) => void;
  path: "/jobs" | "/jobs/all";
  title: string;
  subtitle: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[#EEF2FB]">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] lg:block">
        <Image
          src="/images/jobs-hero.jpg"
          alt=""
          fill
          priority
          className="object-cover object-[center_35%]"
          sizes="48vw"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#EEF2FB] via-[#EEF2FB]/70 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#EEF2FB]/80 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pt-10 pb-8 sm:pt-12 sm:pb-10">
        {path === "/jobs/all" ? (
          <Link href={buildJobsHref("/jobs", { query, country, category })} className="text-sm font-semibold text-primary">
            Back to job highlights
          </Link>
        ) : null}
        <p className={cn("text-[11px] font-bold tracking-[0.16em] text-[#B8914C] uppercase", path === "/jobs/all" && "mt-3")}>
          Overseas career opportunities
        </p>
        <h1 className="mt-3 max-w-xl text-[2rem] leading-tight font-bold tracking-tight text-primary sm:text-[2.35rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-[15px]">{subtitle}</p>

        <form
          data-jobs-filters
          className="mt-8 grid max-w-4xl gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border sm:grid-cols-[1.4fr_1fr_1fr] sm:gap-0 sm:divide-x sm:divide-border sm:p-2"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="flex items-center gap-3 px-3 py-1.5">
            <Search aria-hidden className="size-4 shrink-0 text-primary" />
            <span className="sr-only">Search</span>
            <Input
              value={query}
              onChange={(event) => onUpdate({ query: event.target.value })}
              placeholder="Search job title, skill, or employer"
              className={fieldClass}
            />
          </label>
          <label className="flex items-center gap-3 px-3 py-1.5">
            <MapPin aria-hidden className="size-4 shrink-0 text-primary" />
            <span className="sr-only">Destination</span>
            <select
              value={country}
              onChange={(event) => onUpdate({ country: event.target.value })}
              className={cn(fieldClass, "cursor-pointer appearance-none")}
            >
              <option value="">All destinations</option>
              {DESTINATIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 px-3 py-1.5">
            <Briefcase aria-hidden className="size-4 shrink-0 text-primary" />
            <span className="sr-only">Category</span>
            <select
              value={category}
              onChange={(event) => onUpdate({ category: event.target.value })}
              className={cn(fieldClass, "cursor-pointer appearance-none")}
            >
              <option value="">All job categories</option>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </form>
      </div>
    </section>
  );
}

function ApplyingAside() {
  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await api<Actor | null>("/api/session")).data,
    staleTime: 60_000,
  });
  const signedIn = Boolean(session.data);
  const portal = session.data?.role === "staff" ? "/agency" : "/applicant";

  return (
    <aside data-jobs-aside className="h-max rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gold text-primary">
          <UserPlus className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-bold tracking-tight">Applying with Crowne</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {signedIn ? "You are signed in. Keep your profile current while you browse." : "Four steps from account to tracked application."}
          </p>
        </div>
      </div>
      <ul className="mt-5 grid gap-3">
        {STEPS.map((step) => (
          <li key={step} className="flex items-start gap-2.5 text-sm text-foreground">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
            <span>{step}</span>
          </li>
        ))}
      </ul>
      <Link href={signedIn ? portal : "/register"} className={cn(buttonVariants(), "mt-5 h-10 w-full")}>
        {signedIn ? (session.data?.role === "staff" ? "Open agency workspace" : "Open my portal") : "Create applicant account"}
      </Link>
    </aside>
  );
}

function JobListCard({ job }: { job: PublicJob }) {
  return (
    <article
      data-jobs-card
      className="group flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border transition-shadow hover:shadow-sm sm:flex-row sm:items-stretch sm:gap-5 sm:p-6"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-royal-soft text-primary">
        <CategoryIcon category={job.category || job.title} className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold tracking-tight text-primary">{job.title}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>{job.employer}</span>
          <span aria-hidden className="text-border">|</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {job.country}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {job.employmentType ? (
            <span className="rounded-full bg-royal-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
              {job.employmentType}
            </span>
          ) : null}
          <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
            {job.vacancies} {job.vacancies === 1 ? "vacancy" : "vacancies"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{blurb(job.description)}</p>
      </div>
      <div className="flex shrink-0 items-center sm:items-end sm:pl-2">
        <Link href={`/jobs/${job.id}`} className={cn(buttonVariants(), "h-10 gap-1.5 px-4")}>
          View details
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

function JobGridCard({ job }: { job: PublicJob }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      data-jobs-grid-card
      className="group flex h-full flex-col rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-royal-soft text-primary">
          <CategoryIcon category={job.category || job.title} className="size-5" />
        </span>
        <span className="grid size-8 place-items-center rounded-full bg-gold text-gold-foreground transition-transform duration-300 group-hover:translate-x-0.5">
          <ArrowRight className="size-3.5" />
        </span>
      </div>
      <h2 className="mt-4 text-lg font-bold tracking-tight text-primary">{job.title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{job.employer}</p>
      <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" />
        {job.country}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {job.employmentType ? (
          <span className="rounded-full bg-royal-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
            {job.employmentType}
          </span>
        ) : null}
        <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
          {job.vacancies} {job.vacancies === 1 ? "vacancy" : "vacancies"}
        </span>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{blurb(job.description)}</p>
    </Link>
  );
}

export function JobsScreen() {
  const { query, country, category, update, jobs } = useJobsFilters();
  const count = jobs.data?.length ?? 0;
  const preview = jobs.data?.slice(0, PREVIEW_LIMIT) ?? [];
  const hasMore = count > PREVIEW_LIMIT;

  return (
    <div>
      <JobsHero
        query={query}
        country={country}
        category={category}
        onUpdate={(next) => update(next, "/jobs")}
        path="/jobs"
        title="Find a job opportunity"
        subtitle="Browse published overseas vacancies and take the next step in your career."
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8 lg:py-10">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p data-jobs-count className="text-sm font-semibold text-foreground">
              {jobs.isLoading
                ? "Loading vacancies…"
                : hasMore
                  ? `Showing ${PREVIEW_LIMIT} of ${count} job vacancies`
                  : `${count} job ${count === 1 ? "vacancy" : "vacancies"}`}
            </p>
            <p className="text-sm text-muted-foreground">
              Sort by: <span className="font-medium text-foreground">Most recent</span>
            </p>
          </div>

          <QueryState
            isLoading={jobs.isLoading}
            isError={jobs.isError}
            error={jobs.error}
            isEmpty={jobs.data?.length === 0}
            empty="No published jobs match those filters."
          >
            <ul className="grid gap-4">
              {preview.map((job) => (
                <li key={job.id}>
                  <JobListCard job={job} />
                </li>
              ))}
            </ul>
          </QueryState>

          {hasMore ? (
            <div className="mt-6 flex justify-center">
              <Link
                href={buildJobsHref("/jobs/all", { query, country, category })}
                data-jobs-view-more
                className={cn(buttonVariants({ variant: "outline" }), "h-11 gap-2 px-5")}
              >
                View more jobs
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : null}

          <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
            <span aria-hidden className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-royal-soft text-[10px] font-bold text-primary">
              i
            </span>
            Only published jobs are listed. Draft publications stay off this page.
          </p>
        </div>

        <ApplyingAside />
      </div>
    </div>
  );
}

export function JobsAllScreen() {
  const { query, country, category, update, jobs } = useJobsFilters();
  const count = jobs.data?.length ?? 0;

  return (
    <div>
      <JobsHero
        query={query}
        country={country}
        category={category}
        onUpdate={(next) => update(next, "/jobs/all")}
        path="/jobs/all"
        title="All job openings"
        subtitle="Every published overseas vacancy currently open on the Crowne careers site."
      />

      <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <p data-jobs-count className="text-sm font-semibold text-foreground">
            {jobs.isLoading ? "Loading vacancies…" : `${count} job ${count === 1 ? "vacancy" : "vacancies"}`}
          </p>
          <p className="text-sm text-muted-foreground">
            Sort by: <span className="font-medium text-foreground">Most recent</span>
          </p>
        </div>

        <QueryState
          isLoading={jobs.isLoading}
          isError={jobs.isError}
          error={jobs.error}
          isEmpty={jobs.data?.length === 0}
          empty="No published jobs match those filters."
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.data?.map((job) => (
              <li key={job.id}>
                <JobGridCard job={job} />
              </li>
            ))}
          </ul>
        </QueryState>

        <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
          <span aria-hidden className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-royal-soft text-[10px] font-bold text-primary">
            i
          </span>
          Only published jobs are listed. Draft publications stay off this page.
        </p>
      </div>
    </div>
  );
}
