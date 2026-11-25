"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, ReactNode, useState } from "react";
import { BookOpen, Building2, CalendarDays, GraduationCap, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/browser";
import type { EducationEntry, WorkExperienceEntry } from "@/lib/data/types";
import { cn } from "cn";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const workExperienceKey = ["profile", "work-experience"] as const;
export const educationKey = ["profile", "education"] as const;

export function formatMonth(value: string) {
  const [year, month] = value.split("-");
  const label = MONTHS[Number(month) - 1];
  return label && year ? `${label} ${year}` : value;
}

export function formatPeriod(entry: { startMonth: string; endMonth: string; isCurrent: boolean }) {
  return `${formatMonth(entry.startMonth)} – ${entry.isCurrent ? "Present" : formatMonth(entry.endMonth)}`;
}

export function useWorkExperience() {
  return useQuery({
    queryKey: workExperienceKey,
    queryFn: async () => (await api<WorkExperienceEntry[]>("/api/profile/work-experience")).data,
  });
}

export function useEducation() {
  return useQuery({
    queryKey: educationKey,
    queryFn: async () => (await api<EducationEntry[]>("/api/profile/education")).data,
  });
}

type WorkDraft = Omit<WorkExperienceEntry, "id" | "candidateId">;
type EducationDraft = Omit<EducationEntry, "id" | "candidateId">;

const emptyWork: WorkDraft = { jobTitle: "", employerName: "", country: "", startMonth: "", endMonth: "", isCurrent: false, description: "" };
const emptyEducation: EducationDraft = { qualification: "", school: "", fieldOfStudy: "", startMonth: "", endMonth: "", isCurrent: false };

function useEntryMutations(path: string, noun: string) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["profile"] });
  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: unknown }) =>
      api(id ? `${path}/${id}` : path, { method: id ? "PATCH" : "POST", body: JSON.stringify(body) }),
    onSuccess: async (_data, variables) => {
      toast.success(variables.id ? `${noun} updated.` : `${noun} added.`);
      await refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : `The ${noun.toLowerCase()} could not be saved.`),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => api(`${path}/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success(`${noun} deleted.`);
      await refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : `The ${noun.toLowerCase()} could not be deleted.`),
  });
  return { save, remove };
}

function PanelHeader({ title, description, action, onAction }: { title: string; description: string; action: string; onAction: () => void }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-6 pt-6 pb-5">
      <CardTitle className="text-lg font-bold tracking-tight">{title}</CardTitle>
      <Button type="button" className="h-10 shrink-0 px-4" aria-label={action} onClick={onAction}>
        <Plus className="size-4" />
        <span className="sm:hidden">Add</span>
        <span className="hidden sm:inline">{action}</span>
      </Button>
      <CardDescription className="col-span-2">{description}</CardDescription>
    </div>
  );
}

function IconTile({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg bg-royal-soft text-primary", className)}>{children}</span>;
}

function EmptyEntries({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <IconTile>{icon}</IconTile>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

function LegacyNote({ value, field }: { value: string; field: "experience" | "education" }) {
  const queryClient = useQueryClient();
  const clear = useMutation({
    mutationFn: async () => api("/api/profile", { method: "PATCH", body: JSON.stringify({ [field]: "" }) }),
    onSuccess: async () => {
      toast.success("Earlier note removed.");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The note could not be removed."),
  });
  if (!value.trim()) return null;
  return (
    <p className="text-xs text-muted-foreground">
      Earlier note: <span className="font-medium text-foreground">“{value}”</span>. It was saved before entries existed and does not count toward completion.{" "}
      <button type="button" className="font-medium text-primary hover:underline disabled:opacity-50" disabled={clear.isPending} onClick={() => clear.mutate()}>
        {clear.isPending ? "Removing…" : "Remove note"}
      </button>
    </p>
  );
}

function ConfirmDelete({ open, label, pending, onCancel, onConfirm }: { open: boolean; label: string; pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this entry?</DialogTitle>
          <DialogDescription>{label} will be removed from your profile. This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="h-10 px-5" onClick={onCancel}>Keep entry</Button>
          <Button type="button" className="h-10 bg-destructive px-5 text-white hover:bg-destructive/90" disabled={pending} onClick={onConfirm}>
            {pending ? "Deleting…" : "Delete entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, required, children, hint }: { id: string; label: string; required?: boolean; children: ReactNode; hint?: ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <div className="mt-2">{children}</div>
      {hint}
    </div>
  );
}

const control = "h-10 bg-card px-3 text-sm";

function PeriodFields({
  prefix,
  draft,
  currentLabel,
  onChange,
}: {
  prefix: string;
  draft: { startMonth: string; endMonth: string; isCurrent: boolean };
  currentLabel: string;
  onChange: (patch: Partial<{ startMonth: string; endMonth: string; isCurrent: boolean }>) => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${prefix}-start`} label="Start month" required>
          <Input id={`${prefix}-start`} type="month" required value={draft.startMonth} onChange={(event) => onChange({ startMonth: event.target.value })} className={control} />
        </Field>
        <Field id={`${prefix}-end`} label="End month" required={!draft.isCurrent}>
          <Input
            id={`${prefix}-end`}
            type="month"
            required={!draft.isCurrent}
            disabled={draft.isCurrent}
            min={draft.startMonth || undefined}
            value={draft.isCurrent ? "" : draft.endMonth}
            onChange={(event) => onChange({ endMonth: event.target.value })}
            className={control}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-primary" checked={draft.isCurrent} onChange={(event) => onChange({ isCurrent: event.target.checked, endMonth: "" })} />
        {currentLabel}
      </label>
    </>
  );
}

function EntryDialog({
  open,
  title,
  description,
  submitLabel,
  pending,
  onClose,
  onSubmit,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}) {
  function submit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    onSubmit();
  }
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" className="h-10 bg-card px-5" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="h-10 px-5" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ListState({ isLoading, isError, children }: { isLoading: boolean; isError: boolean; children: ReactNode }) {
  if (isLoading) return <div className="h-28 animate-pulse rounded-xl bg-muted/60" aria-label="Loading entries" />;
  if (isError) return <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">The entries could not be loaded. Refresh the page to try again.</p>;
  return <>{children}</>;
}

export function WorkExperienceSection({ legacyNote }: { legacyNote: string }) {
  const entries = useWorkExperience();
  const { save, remove } = useEntryMutations("/api/profile/work-experience", "Work experience");
  const [editing, setEditing] = useState<{ id?: string; draft: WorkDraft } | null>(null);
  const [deleting, setDeleting] = useState<WorkExperienceEntry | null>(null);
  const draft = editing?.draft ?? emptyWork;
  const update = (patch: Partial<WorkDraft>) => setEditing((current) => (current ? { ...current, draft: { ...current.draft, ...patch } } : current));

  return (
    <>
      <PanelHeader title="Work experience" description="Add your employment history, starting with the most recent." action="Add work experience" onAction={() => setEditing({ draft: emptyWork })} />
      <div className="grid gap-4 px-6 pb-6">
        <ListState isLoading={entries.isLoading} isError={entries.isError}>
          {entries.data?.length ? (
            entries.data.map((entry) => (
              <article key={entry.id} className="@container flex gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
                <IconTile className="hidden @sm:grid"><Building2 className="size-5" /></IconTile>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] leading-snug font-bold">{entry.jobTitle}</h3>
                      <p className="mt-0.5 text-sm">{entry.employerName}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button type="button" variant="outline" size="icon" className="bg-card" aria-label={`Edit ${entry.jobTitle}`} onClick={() => setEditing({ id: entry.id, draft: { ...entry } })}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" className="bg-card" aria-label={`Delete ${entry.jobTitle}`} onClick={() => setDeleting(entry)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                    {entry.country ? <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{entry.country}</span> : null}
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{formatPeriod(entry)}</span>
                    {entry.isCurrent ? <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">Current</span> : null}
                  </div>
                  {entry.description ? <p className="mt-2.5 text-xs leading-relaxed whitespace-pre-line text-muted-foreground">{entry.description}</p> : null}
                </div>
              </article>
            ))
          ) : (
            <EmptyEntries icon={<Building2 className="size-5" />} title="No work experience added yet" body="Add each job you have held. Start with your current or most recent position." />
          )}
        </ListState>
        <LegacyNote value={legacyNote} field="experience" />
      </div>
      <EntryDialog
        open={editing !== null}
        title={editing?.id ? "Edit work experience" : "Add work experience"}
        description="The recruitment team reads this when matching you to job orders."
        submitLabel={editing?.id ? "Save changes" : "Add work experience"}
        pending={save.isPending}
        onClose={() => setEditing(null)}
        onSubmit={() => editing && save.mutate({ id: editing.id, body: draft }, { onSuccess: () => setEditing(null) })}
      >
        <Field id="work-title" label="Job title" required>
          <Input id="work-title" required maxLength={120} value={draft.jobTitle} onChange={(event) => update({ jobTitle: event.target.value })} className={control} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="work-employer" label="Employer" required>
            <Input id="work-employer" required maxLength={160} value={draft.employerName} onChange={(event) => update({ employerName: event.target.value })} className={control} />
          </Field>
          <Field id="work-country" label="Country">
            <Input id="work-country" maxLength={80} value={draft.country} onChange={(event) => update({ country: event.target.value })} className={control} />
          </Field>
        </div>
        <PeriodFields prefix="work" draft={draft} currentLabel="I currently work here" onChange={update} />
        <Field id="work-description" label="Description" hint={<p className="mt-1 text-right text-xs text-muted-foreground tabular-nums">{draft.description.length}/600</p>}>
          <Textarea id="work-description" rows={4} maxLength={600} value={draft.description} onChange={(event) => update({ description: event.target.value })} className="bg-card px-3 text-sm" />
        </Field>
      </EntryDialog>
      <ConfirmDelete
        open={deleting !== null}
        label={deleting ? `${deleting.jobTitle} at ${deleting.employerName}` : ""}
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}

export function EducationSection({ legacyNote }: { legacyNote: string }) {
  const entries = useEducation();
  const { save, remove } = useEntryMutations("/api/profile/education", "Education");
  const [editing, setEditing] = useState<{ id?: string; draft: EducationDraft } | null>(null);
  const [deleting, setDeleting] = useState<EducationEntry | null>(null);
  const draft = editing?.draft ?? emptyEducation;
  const update = (patch: Partial<EducationDraft>) => setEditing((current) => (current ? { ...current, draft: { ...current.draft, ...patch } } : current));
  const count = entries.data?.length ?? 0;

  return (
    <>
      <PanelHeader
        title="Education"
        description="Add your educational background, including your school, qualification, and field of study."
        action="Add education"
        onAction={() => setEditing({ draft: emptyEducation })}
      />
      <div className="grid gap-4 px-6 pb-6">
        <ListState isLoading={entries.isLoading} isError={entries.isError}>
          {count ? (
            entries.data?.map((entry) => (
              <article key={entry.id} className="@container flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
                <IconTile className="hidden @sm:grid"><GraduationCap className="size-5" /></IconTile>
                <div className="flex min-w-0 flex-1 items-start gap-3 @lg:items-center">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] leading-snug font-bold">{entry.qualification}</h3>
                  <p className="mt-0.5 text-sm">{entry.school}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><CalendarDays className="size-3.5" />{formatPeriod(entry)}</span>
                    {entry.fieldOfStudy ? (
                      <>
                        <span aria-hidden className="hidden h-3.5 w-px bg-border @lg:block" />
                        <span className="inline-flex items-center gap-1.5"><BookOpen className="size-3.5 shrink-0" />{entry.fieldOfStudy}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="outline" className="h-8 gap-1.5 bg-card px-3" aria-label={`Edit ${entry.qualification}`} onClick={() => setEditing({ id: entry.id, draft: { ...entry } })}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-destructive/40 bg-card text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${entry.qualification}`}
                    onClick={() => setDeleting(entry)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyEntries icon={<GraduationCap className="size-5" />} title="No education added yet" body="Add the schools you attended and the qualification you earned, starting with the most recent." />
          )}
        </ListState>
        <LegacyNote value={legacyNote} field="education" />
      </div>
      {count ? (
        <div className="mt-auto border-t border-border px-6 py-4 text-sm text-muted-foreground">
          {count} education {count === 1 ? "entry" : "entries"}
        </div>
      ) : null}
      <EntryDialog
        open={editing !== null}
        title={editing?.id ? "Edit education" : "Add education"}
        description="List the qualification as it appears on your diploma or certificate."
        submitLabel={editing?.id ? "Save changes" : "Add education"}
        pending={save.isPending}
        onClose={() => setEditing(null)}
        onSubmit={() => editing && save.mutate({ id: editing.id, body: draft }, { onSuccess: () => setEditing(null) })}
      >
        <Field id="edu-qualification" label="Qualification" required>
          <Input id="edu-qualification" required maxLength={120} value={draft.qualification} onChange={(event) => update({ qualification: event.target.value })} className={control} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="edu-school" label="School" required>
            <Input id="edu-school" required maxLength={160} value={draft.school} onChange={(event) => update({ school: event.target.value })} className={control} />
          </Field>
          <Field id="edu-field" label="Field of study">
            <Input id="edu-field" maxLength={120} value={draft.fieldOfStudy} onChange={(event) => update({ fieldOfStudy: event.target.value })} className={control} />
          </Field>
        </div>
        <PeriodFields prefix="edu" draft={draft} currentLabel="I currently study here" onChange={update} />
      </EntryDialog>
      <ConfirmDelete
        open={deleting !== null}
        label={deleting ? `${deleting.qualification} at ${deleting.school}` : ""}
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
