"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  CalendarDays,
  Download,
  Ellipsis,
  GripVertical,
  Monitor,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ApplicationDetailDialog } from "@/features/agency/application-detail-dialog";
import { api } from "@/lib/api/browser";
import type { ApplicationView } from "@/lib/data/demo-store";
import { PIPELINE_COLUMNS, type ApplicationStage } from "@/lib/domain/stages";
import { cn } from "cn";

const COLUMN_TONE: Record<string, string> = {
  "New application": "bg-[#E8F1FF] text-[#1E4B8C]",
  Screening: "bg-[#FFF0E0] text-[#9A5B16]",
  Shortlisted: "bg-[#E7F6EC] text-[#1F6B45]",
  "Employer review": "bg-[#F0E9FF] text-[#5B3FA6]",
  Selected: "bg-[#EEF3D8] text-[#5C6B1F]",
};

const STAGE_OPTIONS: ApplicationStage[] = [...PIPELINE_COLUMNS, "Rejected", "On hold", "Withdrawn"];

function columnId(stage: ApplicationStage) {
  return `column:${stage}`;
}

function parseColumn(id: string | undefined | null): ApplicationStage | null {
  if (!id?.startsWith("column:")) return null;
  const stage = id.slice("column:".length);
  return PIPELINE_COLUMNS.includes(stage as (typeof PIPELINE_COLUMNS)[number]) ? (stage as ApplicationStage) : null;
}

function ApplicationCard({
  application,
  overlay,
  onOpen,
  onStage,
}: {
  application: ApplicationView;
  overlay?: boolean;
  onOpen: (application: ApplicationView) => void;
  onStage: (id: string, stage: ApplicationStage) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { application },
    disabled: overlay,
  });

  const style: CSSProperties | undefined = overlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.35 : 1,
      };

  return (
    <article
      ref={overlay ? undefined : setNodeRef}
      style={style}
      data-recruit-card
      data-application-id={application.id}
      className={cn(
        "rounded-xl bg-card p-3 shadow-xs ring-1 ring-border",
        !overlay && "cursor-grab touch-none",
        overlay && "cursor-grabbing shadow-md ring-primary/30",
      )}
      {...(overlay ? {} : { ...listeners, ...attributes })}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 rounded-md p-1 text-muted-foreground" aria-hidden>
          <GripVertical className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-primary">{application.candidateName}</p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{application.reference}</p>
            </div>
            {!overlay ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      aria-label={`Actions for ${application.candidateName}`}
                      onPointerDown={(event) => event.stopPropagation()}
                    />
                  }
                >
                  <Ellipsis className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => onOpen(application)}>View application</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {STAGE_OPTIONS.map((stage) => (
                    <DropdownMenuItem
                      key={stage}
                      disabled={stage === application.stage}
                      onClick={() => onStage(application.id, stage)}
                    >
                      Move to {stage}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          <ul className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Briefcase className="size-3.5 shrink-0 text-primary/70" />
              <span className="truncate">{application.jobTitle} · {application.country}</span>
            </li>
            <li className="flex items-center gap-2">
              <CalendarDays className="size-3.5 shrink-0 text-primary/70" />
              <span>{application.appliedOn}</span>
            </li>
            <li className="flex items-center gap-2">
              <Monitor className="size-3.5 shrink-0 text-primary/70" />
              <span className="truncate">{application.source}</span>
            </li>
          </ul>

          {!overlay ? (
            <Button
              type="button"
              variant="secondary"
              className="mt-3 h-8 w-full bg-royal-soft text-primary hover:bg-royal-soft/80"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onOpen(application)}
            >
              View application
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StageColumn({
  stage,
  children,
  count,
}: {
  stage: ApplicationStage;
  children: ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId(stage) });
  return (
    <section
      data-recruit-column={stage}
      className={cn(
        "flex min-h-[28rem] min-w-[220px] flex-col rounded-2xl bg-card p-3 shadow-xs ring-1 ring-border transition-shadow",
        isOver && "ring-primary/40 bg-royal-soft/50",
      )}
    >
      <header className={cn("mb-3 flex items-center justify-between rounded-xl px-3 py-2", COLUMN_TONE[stage])}>
        <h2 className="text-sm font-bold">{stage}</h2>
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-card/90 px-1.5 text-[11px] font-semibold">
          {count}
        </span>
      </header>
      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2">
        {children}
        {count === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border px-3 py-8 text-center bg-secondary/40">
            <GripVertical className="size-5 text-muted-foreground/50" />
            <p className="mt-2 text-xs text-muted-foreground">Drop applications here.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function exportCsv(rows: ApplicationView[]) {
  const header = ["reference", "candidate", "job", "country", "employer", "stage", "source", "appliedOn"];
  const body = rows.map((row) =>
    [row.reference, row.candidateName, row.jobTitle, row.country, row.employer, row.stage, row.source, row.appliedOn]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "crowne-applications.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RecruitmentScreen() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApplicationView | null>(null);

  const applications = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await api<ApplicationView[]>("/api/applications")).data,
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; stage: ApplicationStage }) =>
      api(`/api/applications/${input.id}`, { method: "PATCH", body: JSON.stringify({ stage: input.stage }) }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["applications"] });
      const previous = queryClient.getQueryData<ApplicationView[]>(["applications"]);
      queryClient.setQueryData<ApplicationView[]>(["applications"], (current) =>
        (current ?? []).map((application) => (application.id === input.id ? { ...application, stage: input.stage } : application)),
      );
      setSelected((current) => (current?.id === input.id ? { ...current, stage: input.stage } : current));
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(["applications"], context.previous);
      toast.error(error instanceof Error ? error.message : "The stage could not be updated.");
    },
    onSuccess: async (_data, input) => {
      toast.success(`Moved to ${input.stage}.`);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["processing"] });
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (applications.data ?? []).filter((application) => {
      const haystack = `${application.candidateName} ${application.jobTitle} ${application.reference} ${application.employer}`.toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesJob = !jobFilter || application.jobTitle === jobFilter;
      const matchesSource = !sourceFilter || application.source === sourceFilter;
      return matchesQuery && matchesJob && matchesSource;
    });
  }, [applications.data, query, jobFilter, sourceFilter]);

  const jobs = useMemo(
    () => [...new Set((applications.data ?? []).map((application) => application.jobTitle))].sort(),
    [applications.data],
  );
  const sources = useMemo(
    () => [...new Set((applications.data ?? []).map((application) => application.source))].sort(),
    [applications.data],
  );

  const active = filtered.find((application) => application.id === activeId) ?? null;

  function move(id: string, stage: ApplicationStage) {
    const current = (applications.data ?? []).find((application) => application.id === id);
    if (!current || current.stage === stage) return;
    update.mutate({ id, stage });
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;
    let next = parseColumn(overId);
    if (!next) {
      const overCard = (applications.data ?? []).find((application) => application.id === overId);
      if (overCard && PIPELINE_COLUMNS.includes(overCard.stage as (typeof PIPELINE_COLUMNS)[number])) {
        next = overCard.stage;
      }
    }
    if (next) move(String(event.active.id), next);
  }

  const selectClass =
    "h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div data-recruit>
      <PageHeader
        kicker="Recruitment workspace"
        title="Application pipeline"
        description="Move applications through recruitment stages. One candidate can have multiple applications."
      />

      <div data-recruit-filters className="mb-4 flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-border lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search candidate, job or reference"
            className="h-10 pl-9"
          />
        </label>
        <select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)} className={selectClass} aria-label="Job order">
          <option value="">Job order</option>
          {jobs.map((job) => (
            <option key={job} value={job}>{job}</option>
          ))}
        </select>
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className={selectClass} aria-label="Source">
          <option value="">Source</option>
          {sources.map((source) => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
        <span title="Date range filtering is not available yet." className={cn(selectClass, "inline-flex items-center gap-2 text-muted-foreground")}>
          <CalendarDays className="size-4" />
          All time
        </span>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-1.5")}
          onClick={() => exportCsv(filtered)}
          disabled={filtered.length === 0}
        >
          <Download className="size-4" />
          Export
        </button>
      </div>

      <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <GripVertical className="size-3.5" />
          Drag cards to update application stage
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="grid size-4 place-items-center rounded-full bg-royal-soft text-[10px] font-bold text-primary">i</span>
          You can also change stages from the card menu.
        </span>
      </p>

      <QueryState isLoading={applications.isLoading} isError={applications.isError} error={applications.error}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div data-recruit-board className="flex gap-3 overflow-x-auto pb-2">
            {PIPELINE_COLUMNS.map((stage) => {
              const cards = filtered.filter((application) => application.stage === stage);
              return (
                <StageColumn key={stage} stage={stage} count={cards.length}>
                  {cards.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      onOpen={setSelected}
                      onStage={move}
                    />
                  ))}
                </StageColumn>
              );
            })}
          </div>
          <DragOverlay dropAnimation={null}>
            {active ? (
              <ApplicationCard application={active} overlay onOpen={() => undefined} onStage={() => undefined} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </QueryState>

      <ApplicationDetailDialog
        application={selected}
        onClose={() => setSelected(null)}
        onStage={move}
        pending={update.isPending}
      />
    </div>
  );
}
