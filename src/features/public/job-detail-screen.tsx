"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IllustrativeNote } from "@/components/shared/illustrative-note";
import { QueryState } from "@/components/shared/query-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api/browser";
import type { PublicJobDetail } from "@/lib/data/demo-store";

export function JobDetailScreen({ jobId }: { jobId: string }) {
  const queryClient = useQueryClient();
  const job = useQuery({
    queryKey: ["jobs", jobId],
    queryFn: async () => (await api<PublicJobDetail>(`/api/jobs/${jobId}`)).data,
  });
  const apply = useMutation({
    mutationFn: async () => api("/api/applications", { method: "POST", body: JSON.stringify({ publicationId: jobId }) }),
    onSuccess: async () => {
      toast.success("Application submitted.");
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Sign in with an applicant account before applying.");
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link href="/jobs" className="text-sm font-semibold text-primary">Back to job listings</Link>
      <QueryState isLoading={job.isLoading} isError={job.isError} error={job.error}>
        {job.data ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <section className="rounded-xl border border-border bg-card p-5">
                <h1 className="text-2xl font-semibold">{job.data.title}</h1>
                <p className="text-sm text-muted-foreground">{job.data.employer} · {job.data.country} · {job.data.jobOrderReference}</p>
                <p className="mt-3 text-sm text-muted-foreground">{job.data.vacancies} vacancies · {job.data.employmentType}</p>
              </section>
              <section className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                <h2 className="text-base font-semibold text-foreground">Job description</h2>
                <p className="mt-2">{job.data.description}</p>
                <h3 className="mt-4 font-semibold text-foreground">Qualifications</h3>
                <ul className="mt-2 list-disc pl-5">{job.data.qualifications.map((item) => <li key={item}>{item}</li>)}</ul>
                <h3 className="mt-4 font-semibold text-foreground">Responsibilities</h3>
                <ul className="mt-2 list-disc pl-5">{job.data.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            </div>
            <aside className="h-max rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-bold tracking-[0.14em] text-warning uppercase">Compensation</p>
              <p className="mt-2 text-lg font-semibold text-primary">{job.data.salaryLabel}</p>
              <IllustrativeNote>Compensation label saved on this job.</IllustrativeNote>
              <Button className="mt-4 w-full" disabled={apply.isPending} onClick={() => apply.mutate()}>
                {apply.isPending ? "Submitting…" : "Apply for this position"}
              </Button>
              <Link href="/register" className={buttonVariants({ variant: "outline", className: "mt-2 w-full" })}>Create an account first</Link>
              <p className="mt-3 text-xs text-muted-foreground">You need an applicant account to submit and track an application.</p>
            </aside>
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
