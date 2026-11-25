import Link from "next/link";
import { ArrowRight, ClipboardList, FileCheck2, MessageSquareText, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

const STEPS = [
  {
    icon: UserRound,
    title: "Create your Crowne account",
    body: "Register once with your basic details. That profile stays with you for every job you apply to.",
  },
  {
    icon: ClipboardList,
    title: "Complete your profile",
    body: "Add work history, education, and the documents recruiters usually ask for before screening starts.",
  },
  {
    icon: FileCheck2,
    title: "Apply to published jobs",
    body: "Open a listing, review the role, and submit an application from the careers site or your portal.",
  },
  {
    icon: MessageSquareText,
    title: "Track each application",
    body: "Screening, shortlist, and selection updates show up in your applicant portal, per application.",
  },
] as const;

const NOTES = [
  {
    title: "One profile, many applications",
    body: "You keep a single Crowne profile. Each job you apply to has its own status and history.",
  },
  {
    title: "Published jobs only",
    body: "What you see on Find jobs are roles Crowne has published. Draft or internal postings stay off the public site.",
  },
  {
    title: "Government steps stay official",
    body: "Crowne tracks recruitment workflow. Official approvals remain with the agencies responsible for them.",
  },
] as const;

export function HowItWorksScreen() {
  return (
    <div className="bg-[#F7F6F2]">
      <section className="border-b border-[#E8E6DF] bg-[#FBFBF8]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#B8911E] uppercase">Applicant path</p>
          <h1 className="font-display mt-3 max-w-2xl text-[2rem] leading-tight font-semibold tracking-tight text-primary sm:text-[2.35rem]">
            How applying works
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5C6478] sm:text-[15px]">
            From account setup to status updates in your portal. No jargon, just the steps Crowne applicants follow.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/register" className={cn(buttonVariants(), "h-10 gap-2 rounded-full px-4")}>
              Create applicant account
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/jobs"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full border-primary/20 px-4 text-primary")}
            >
              Browse job openings
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
        <ol className="grid gap-4 md:grid-cols-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-[#E8E6DF] sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-royal-soft text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-[0.14em] text-[#B8911E] uppercase">
                      Step {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-primary">{step.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#5C6478]">{step.body}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-t border-[#E8E6DF] bg-[#FBFBF8]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-primary">Good to know</h2>
          <p className="mt-1.5 max-w-xl text-sm text-[#5C6478]">A few details that often get asked before the first application.</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {NOTES.map((note) => (
              <li key={note.title} className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-[#E8E6DF]">
                <h3 className="text-base font-semibold text-primary">{note.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5C6478]">{note.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
