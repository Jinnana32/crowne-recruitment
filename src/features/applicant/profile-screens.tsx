"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Briefcase, Check, Circle, Eye, FileText, GraduationCap, Languages, Lock, MapPin, UserRound } from "lucide-react";
import { toast } from "sonner";
import { QueryState } from "@/components/shared/query-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/browser";
import type { CandidateView } from "@/lib/data/demo-store";
import { EDITABLE_PROFILE_FIELDS, type EditableProfileKey } from "@/features/applicant/applicant-state";
import { EducationSection, formatPeriod, useEducation, useWorkExperience, WorkExperienceSection } from "@/features/applicant/profile-entries";
import { MIDDLE_EAST_COUNTRIES } from "@/lib/domain/countries";
import { profileCompleteness, type ProfileEntryCounts } from "@/lib/domain/profile";
import { cn } from "cn";

type ProfileForm = Record<EditableProfileKey, string>;

const emptyForm: ProfileForm = {
  fullName: "",
  mobile: "",
  preferredRole: "",
  languages: "",
  preferredDestination: "",
  dateOfBirth: "",
  nationality: "",
};

type Section = {
  id: string;
  title: string;
  description: string;
  icon: typeof UserRound;
  fields: EditableProfileKey[];
  entries?: "work" | "education";
};

const sections: Section[] = [
  { id: "personal", title: "Personal information", description: "Your name, contact details, and identity.", icon: UserRound, fields: ["fullName", "mobile", "dateOfBirth", "nationality"] },
  { id: "summary", title: "Professional summary", description: "The role you want the recruitment team to consider.", icon: FileText, fields: ["preferredRole"] },
  { id: "experience", title: "Work experience", description: "", icon: Briefcase, fields: [], entries: "work" },
  { id: "education", title: "Education", description: "", icon: GraduationCap, fields: [], entries: "education" },
  { id: "skills", title: "Skills and languages", description: "Languages you speak.", icon: Languages, fields: ["languages"] },
  { id: "preferences", title: "Employment preferences", description: "Where you would like to work.", icon: MapPin, fields: ["preferredDestination"] },
];

const labels = Object.fromEntries(EDITABLE_PROFILE_FIELDS.map((field) => [field.key, field.label])) as Record<EditableProfileKey, string>;

function formFromProfile(profile: CandidateView): ProfileForm {
  return {
    fullName: profile.fullName,
    mobile: profile.mobile,
    preferredRole: profile.preferredRole,
    languages: profile.languages,
    preferredDestination: profile.preferredDestination,
    dateOfBirth: profile.dateOfBirth,
    nationality: profile.nationality,
  };
}

function filled(value: string) {
  return value.trim().length > 0;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function sectionState(section: Section, form: ProfileForm, counts: ProfileEntryCounts, legacy: { experience: string; education: string }) {
  if (section.entries) {
    const count = section.entries === "work" ? counts.workExperienceCount : counts.educationCount;
    const note = section.entries === "work" ? legacy.experience : legacy.education;
    if (count > 0) return "complete";
    return filled(note) ? "attention" : "empty";
  }
  const filledCount = section.fields.filter((key) => filled(form[key])).length;
  if (filledCount === section.fields.length) return "complete";
  return filledCount > 0 ? "attention" : "empty";
}

const markLabel = { complete: "Complete", attention: "Needs attention", empty: "Not started" } as const;

function SectionMark({ state }: { state: keyof typeof markLabel }) {
  return (
    <span className="grid size-5 shrink-0 place-items-center" title={markLabel[state]}>
      {state === "complete" ? (
        <span className="grid size-5 place-items-center rounded-full bg-success text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : state === "attention" ? (
        <span className="grid size-5 place-items-center rounded-full border-2 border-warning/70 text-[11px] leading-none font-bold text-warning">!</span>
      ) : (
        <Circle className="size-5 text-muted-foreground/60" strokeWidth={1.75} />
      )}
      <span className="sr-only">{markLabel[state]}</span>
    </span>
  );
}

export function ProfileScreen() {
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api<CandidateView | null>("/api/profile")).data,
  });
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [sectionId, setSectionId] = useState(sections[0].id);
  const [nameError, setNameError] = useState("");
  const [preview, setPreview] = useState(false);
  const [syncedId, setSyncedId] = useState("");
  if (profile.data && syncedId !== profile.data.id) {
    setSyncedId(profile.data.id);
    setForm(formFromProfile(profile.data));
  }
  const saved = profile.data ? formFromProfile(profile.data) : null;
  const dirty = saved !== null && JSON.stringify(form) !== JSON.stringify(saved);
  const section = sections.find((item) => item.id === sectionId) ?? sections[0];
  const headline = [form.preferredRole, form.nationality || form.preferredDestination].filter(filled).join(" · ");
  const work = useWorkExperience();
  const education = useEducation();
  const counts: ProfileEntryCounts = {
    workExperienceCount: work.data?.length ?? profile.data?.workExperienceCount ?? 0,
    educationCount: education.data?.length ?? profile.data?.educationCount ?? 0,
  };
  const legacy = { experience: profile.data?.experience ?? "", education: profile.data?.education ?? "" };
  const completion = profileCompleteness(form, counts);

  const save = useMutation({
    mutationFn: async () => api("/api/profile", { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: async () => {
      toast.success("Profile saved.");
      setNameError("");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The profile could not be saved."),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!filled(form.fullName)) {
      setSectionId("personal");
      setNameError("Enter your full name.");
      return;
    }
    save.mutate();
  }

  function field(key: EditableProfileKey, type: "text" | "date" = "text") {
    const controlClass = "mt-2 h-10 bg-card px-3 text-sm";
    if (key === "preferredDestination") {
      return (
        <div>
          <Label htmlFor={key}>{labels[key]}</Label>
          <select
            id={key}
            value={form.preferredDestination}
            onChange={(event) => setForm((current) => ({ ...current, preferredDestination: event.target.value }))}
            className={cn(controlClass, "w-full rounded-lg border border-input")}
          >
            <option value="">Select a Middle East destination</option>
            {MIDDLE_EAST_COUNTRIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div>
        <Label htmlFor={key}>
          {labels[key]}
          {key === "fullName" || key === "mobile" ? <span className="text-destructive"> *</span> : null}
        </Label>
        <Input
            id={key}
            type={type}
            value={form[key]}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({ ...current, [key]: value }));
              if (key === "fullName") setNameError("");
            }}
            aria-invalid={key === "fullName" && nameError.length > 0}
            className={controlClass}
          />
        {key === "fullName" && nameError ? <p className="mt-1 text-xs text-destructive">{nameError}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[1.65rem] leading-tight font-bold tracking-tight">My professional profile</h1>
            <span className="rounded-full bg-gold/25 px-3 py-1 text-xs font-semibold text-gold-foreground ring-1 ring-gold/50">Resume builder</span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">Build your professional profile so the recruitment team can evaluate your qualifications.</p>
        </div>
        <button type="button" className={cn(buttonVariants({ variant: "outline" }), "h-10 shrink-0 self-start bg-card px-4 shadow-xs")} onClick={() => setPreview(true)}>
          <Eye className="size-4" />
          Preview resume
        </button>
      </div>
      <QueryState isLoading={profile.isLoading} isError={profile.isError} error={profile.error} isEmpty={!profile.data} empty="No profile is linked to this account.">
        <section data-profile-summary className="mb-5 grid gap-6 rounded-xl bg-card p-6 ring-1 ring-foreground/10 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-0">
          <div data-profile-identity className="flex min-w-0 items-center gap-4 md:min-w-[320px] md:pr-10">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-royal-soft text-xl font-semibold text-primary">{initials(form.fullName)}</span>
            <div className="min-w-0 border-border sm:border-l sm:pl-4">
              <p className="truncate text-xl font-bold tracking-tight">{form.fullName || "Your name"}</p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{headline || "Add a role and nationality"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-royal-soft px-3 py-1 text-xs font-semibold text-primary">Applicant</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                  <span className="size-1.5 rounded-full bg-success" />
                  {profile.data?.status === "Active" ? "Profile active" : profile.data?.status}
                </span>
              </div>
            </div>
          </div>
          <div data-profile-completion className="border-border md:border-l md:pl-10">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">Profile completion</p>
              <p className="text-[1.65rem] leading-none font-bold tabular-nums">{profile.data ? `${completion}%` : "—"}</p>
            </div>
            {profile.data ? <Progress value={completion} className="mt-3 h-2.5" /> : null}
            <p className="mt-3 text-xs text-muted-foreground">
              {completion === 100 ? "Every profile field has an entry." : "Complete the open sections to strengthen your application."}
            </p>
          </div>
        </section>
        <div data-profile-layout className="grid items-stretch gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav data-profile-nav aria-label="Profile sections" className="rounded-xl bg-card p-2 ring-1 ring-foreground/10">
            <ul className="divide-y divide-border">
              {sections.map((item) => {
                const Icon = item.icon;
                const state = sectionState(item, form, counts, legacy);
                const active = item.id === section.id;
                return (
                  <li key={item.id} className="py-1">
                    <button
                      type="button"
                      onClick={() => setSectionId(item.id)}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        active ? "bg-royal-soft font-semibold text-primary before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-primary" : "text-foreground hover:bg-royal-soft/50",
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      <span className="min-w-0 flex-1">{item.title}</span>
                      <SectionMark state={state} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Card data-profile-panel className="gap-0 py-0">
            {section.entries === "work" ? (
              <WorkExperienceSection legacyNote={legacy.experience} />
            ) : section.entries === "education" ? (
              <EducationSection legacyNote={legacy.education} />
            ) : (
            <form id="profile-form" onSubmit={submit} className="flex flex-1 flex-col">
            <CardHeader className="px-6 pt-6 pb-5">
              <CardTitle className="text-lg font-bold tracking-tight">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 px-6 pb-6">
              {section.id === "personal" ? (
                <>
                  {field("fullName")}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field("mobile")}
                    <div>
                      <Label htmlFor="email">Email address</Label>
                      <div className="relative mt-2">
                        <Input id="email" value={profile.data?.email ?? ""} readOnly title="Linked to your sign-in. It cannot be changed here." className="h-10 bg-muted/60 pr-9 pl-3 text-sm text-muted-foreground" />
                        <Lock aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field("dateOfBirth", "date")}
                    {field("nationality")}
                  </div>
                </>
              ) : (
                section.fields.map((key) => <div key={key}>{field(key)}</div>)
              )}
            </CardContent>
            <div className="mt-auto flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
              <span className="w-full text-xs text-muted-foreground sm:mr-auto sm:w-auto" aria-live="polite">
                {dirty ? <span className="font-medium text-warning">Unsaved changes</span> : "All changes saved"}
              </span>
              <Button type="button" variant="outline" className="h-10 bg-card px-5" disabled={!dirty || save.isPending} onClick={() => saved && setForm(saved)}>Cancel</Button>
              <Button type="submit" className="h-10 px-5" disabled={save.isPending || !dirty}>{save.isPending ? "Saving…" : "Save changes"}</Button>
            </div>
            </form>
            )}
          </Card>
        </div>
      </QueryState>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.fullName || "Profile preview"}</DialogTitle>
            <DialogDescription>This is the profile text the recruitment team can read. It is not a downloadable file.</DialogDescription>
          </DialogHeader>
          <dl className="grid gap-3 text-sm">
            {EDITABLE_PROFILE_FIELDS.map((item) => (
              <div key={item.key}>
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd>{filled(form[item.key]) ? form[item.key] : "Not entered"}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-muted-foreground">Email address</dt>
              <dd>{profile.data?.email || "Not entered"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Work experience</dt>
              <dd>
                {work.data?.length ? (
                  <ul className="grid gap-1.5">
                    {work.data.map((entry) => (
                      <li key={entry.id}>
                        {entry.jobTitle} · {entry.employerName}
                        <span className="text-muted-foreground"> · {formatPeriod(entry)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "Not entered"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Education</dt>
              <dd>
                {education.data?.length ? (
                  <ul className="grid gap-1.5">
                    {education.data.map((entry) => (
                      <li key={entry.id}>
                        {entry.qualification} · {entry.school}
                        <span className="text-muted-foreground"> · {formatPeriod(entry)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "Not entered"
                )}
              </dd>
            </div>
          </dl>
        </DialogContent>
      </Dialog>
    </div>
  );
}
