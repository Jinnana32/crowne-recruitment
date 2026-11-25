"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Briefcase, Building2, MapPin, Plane, ShieldCheck, Users } from "lucide-react";
import { QueryState } from "@/components/shared/query-state";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import type { PublicJob } from "@/lib/data/demo-store";
import { cn } from "cn";

const TRUST = [
  { icon: ShieldCheck, label: "Licensed agency" },
  { icon: Building2, label: "Verified employers" },
  { icon: Plane, label: "Support through departure" },
] as const;

const STEPS = [
  {
    title: "Create your account",
    body: "Sign up and fill in your Crowne profile once. You can reuse it for later applications.",
  },
  {
    title: "Apply for a job",
    body: "Open a listing, submit your application, and upload any documents the recruiter asks for.",
  },
  {
    title: "Follow the updates",
    body: "Check your applicant portal for screening, shortlist, and selection status.",
  },
] as const;

export function HomeScreen() {
  const jobs = useQuery({
    queryKey: ["jobs", "featured"],
    queryFn: async () => (await api<PublicJob[]>("/api/jobs")).data.slice(0, 3),
  });

  return (
    <div data-home className="bg-[#F7F6F2]">
      <section data-home-hero className="relative isolate overflow-hidden bg-[#F7F6F2]">
        <div className="mx-auto grid max-w-6xl lg:min-h-[min(50vh,460px)] lg:grid-cols-[1fr_1.05fr]">
          <div className="relative z-10 flex flex-col justify-center px-5 py-8 sm:px-6 lg:py-10 lg:pr-8">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#B8911E] uppercase">
              Overseas career opportunities
            </p>
            <h1 className="font-display mt-3 max-w-[15ch] text-[2.1rem] leading-[1.12] font-semibold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem]">
              Work abroad with Crowne
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#5C6478] sm:text-[15px]">
              Find published overseas jobs, apply online, and track each application from your Crowne account.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/jobs"
                className={cn(buttonVariants({ size: "lg" }), "h-10 gap-2 rounded-full px-4 text-sm font-semibold")}
              >
                View job openings
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-10 rounded-full border-primary/20 bg-transparent px-4 text-sm font-semibold text-primary hover:bg-white",
                )}
              >
                Create account
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {TRUST.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label} className="inline-flex items-center gap-2 text-sm text-primary/80">
                    <span className="grid size-7 place-items-center rounded-full bg-[#FFF4C8] text-[#B8911E]">
                      <Icon className="size-3.5" />
                    </span>
                    {item.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="relative min-h-[240px] sm:min-h-[280px] lg:min-h-full">
            <Image
              src="/images/home-hero.jpg"
              alt="Applicant at an airport terminal looking toward a departing plane"
              fill
              priority
              className="object-cover object-[68%_center]"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[#141E68]/25 via-transparent to-transparent lg:hidden"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden bg-[#F7F6F2] lg:block"
              style={{ clipPath: "polygon(0 0, 14% 0, 0 100%)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden bg-gold lg:block"
              style={{ clipPath: "polygon(13.2% 0, 14.4% 0, 0.8% 100%, 0 100%)" }}
            />
          </div>
        </div>
      </section>

      <section data-home-featured className="border-t border-[#E8E6DF] bg-[#FBFBF8]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-primary sm:text-[1.75rem]">
                Featured jobs
              </h2>
              <p className="mt-1.5 max-w-xl text-sm text-[#5C6478]">
                Open roles with Middle East employers on the Crowne careers site.
              </p>
            </div>
            <Link href="/jobs/all" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B8911E] hover:text-primary">
              View all jobs
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <QueryState
            isLoading={jobs.isLoading}
            isError={jobs.isError}
            error={jobs.error}
            isEmpty={jobs.data?.length === 0}
            empty="No published jobs yet."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {jobs.data?.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group relative flex flex-col rounded-2xl bg-card p-4 shadow-xs ring-1 ring-[#E8E6DF] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="absolute top-4 right-4 grid size-8 place-items-center rounded-full bg-gold text-gold-foreground transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowRight className="size-3.5" />
                  </span>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-[#B8911E] uppercase">Overseas</p>
                  <h3 className="font-display mt-2 pr-10 text-xl font-semibold tracking-tight text-primary">{job.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#5C6478]">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-3.5 shrink-0" />
                      {job.employer}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      {job.country}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#E8E6DF] pt-3 text-sm text-[#5C6478]">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5 shrink-0" />
                      {job.vacancies} {job.vacancies === 1 ? "position" : "positions"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="size-3.5 shrink-0" />
                      {job.employmentType || "Full-time"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </QueryState>
        </div>
      </section>

      <section data-home-journey className="border-t border-[#E8E6DF] bg-[#F7F6F2]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-primary sm:text-[1.75rem]">
                How applying works
              </h2>
              <p className="mt-1.5 max-w-xl text-sm text-[#5C6478]">
                From sign-up to status updates inside your applicant portal.
              </p>
            </div>
            <Link href="/how-it-works" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B8911E] hover:text-primary">
              Read the full path
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl bg-card p-4 shadow-xs ring-1 ring-[#E8E6DF]">
                <p className="font-display text-2xl font-semibold text-gold">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-base font-semibold text-primary">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5C6478]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
