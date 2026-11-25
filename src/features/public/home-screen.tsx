"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IllustrativeNote } from "@/components/shared/illustrative-note";
import { QueryState } from "@/components/shared/query-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/browser";
import type { PublicJob } from "@/lib/data/demo-store";
import { MIDDLE_EAST_COUNTRIES } from "@/lib/domain/countries";

export function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const jobs = useQuery({
    queryKey: ["jobs", "featured"],
    queryFn: async () => (await api<PublicJob[]>("/api/jobs")).data.slice(0, 3),
  });

  function search(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (country) params.set("country", country);
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <div>
      <section className="bg-[linear-gradient(115deg,#101a5c_0%,#1e307e_65%,#2d4397_100%)] text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-4 text-xs font-bold tracking-[0.16em] text-gold uppercase">Your next opportunity starts here</p>
            <h1 className="max-w-xl text-4xl leading-tight font-semibold tracking-tight">Build your future. Work abroad with confidence.</h1>
            <p className="mt-4 max-w-lg text-sm text-[#d8def7]">
              Discover overseas job opportunities through 2018 Crowne Human Resources, Inc. Create your profile, apply for jobs, and follow your application progress in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/jobs" className={buttonVariants({ variant: "gold" })}>Explore job opportunities</Link>
              <Link href="/register" className={buttonVariants({ variant: "outline", className: "border-white/40 bg-transparent text-white hover:bg-white/10" })}>
                Create applicant account
              </Link>
            </div>
          </div>
          <form onSubmit={search} className="rounded-2xl bg-card p-5 text-foreground">
            <h2 className="text-base font-semibold">Find your next opportunity</h2>
            <p className="mt-1 text-xs text-muted-foreground">Search available positions by job title or destination.</p>
            <label className="mt-4 block text-xs font-semibold text-muted-foreground" htmlFor="keyword">Job title or keyword</label>
            <Input id="keyword" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Welder, caregiver, driver" className="mt-1 h-10" />
            <label className="mt-3 block text-xs font-semibold text-muted-foreground" htmlFor="destination">Destination</label>
            <select id="destination" value={country} onChange={(event) => setCountry(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm">
              <option value="">Any destination</option>
              {MIDDLE_EAST_COUNTRIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <Button type="submit" className="mt-4 w-full">Search available jobs</Button>
          </form>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Featured opportunities</h2>
            <p className="text-sm text-muted-foreground">Published openings from the current job list.</p>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-primary">View all jobs</Link>
        </div>
        <QueryState isLoading={jobs.isLoading} isError={jobs.isError} error={jobs.error} isEmpty={jobs.data?.length === 0} empty="No published jobs yet.">
          <div className="grid gap-4 md:grid-cols-3">
            {jobs.data?.map((job) => (
              <article key={job.id} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-success">Published</p>
                <h3 className="mt-2 font-semibold">{job.title}</h3>
                <p className="text-xs text-muted-foreground">{job.employer} · {job.country}</p>
                <p className="mt-3 text-xs text-muted-foreground">{job.vacancies} positions · {job.employmentType}</p>
                <p className="mt-3 text-sm font-semibold text-primary">{job.salaryLabel}</p>
                <Link href={`/jobs/${job.id}`} className="mt-2 inline-block text-xs font-semibold text-primary">View details</Link>
              </article>
            ))}
          </div>
        </QueryState>
        <IllustrativeNote>Compensation is the label saved on each published job.</IllustrativeNote>
      </section>
      <section id="how" className="mx-auto max-w-6xl px-5 pb-12">
        <h2 className="text-xl font-semibold tracking-tight">Your journey, made clearer</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {["Create your account", "Apply for a position", "Track your progress"].map((step, index) => (
            <article key={step} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-warning">{`0${index + 1}`}</p>
              <h3 className="mt-2 font-semibold">{step}</h3>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
