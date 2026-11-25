"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IllustrativeNote } from "@/components/shared/illustrative-note";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api/browser";
import type { EmployerView, JobOrderView } from "@/lib/data/demo-store";
import { MIDDLE_EAST_COUNTRIES } from "@/lib/domain/countries";

const emptyOpening: {
  employerName: string;
  country: string;
  title: string;
  vacancies: string;
  category: string;
  salaryLabel: string;
  description: string;
} = {
  employerName: "",
  country: MIDDLE_EAST_COUNTRIES[0],
  title: "",
  vacancies: "1",
  category: "",
  salaryLabel: "",
  description: "",
};

const emptyEdit: {
  id: string;
  title: string;
  country: string;
  vacancies: string;
  category: string;
  employmentType: string;
  salaryLabel: string;
  description: string;
  published: boolean;
} = {
  id: "",
  title: "",
  country: MIDDLE_EAST_COUNTRIES[0],
  vacancies: "1",
  category: "",
  employmentType: "Full-time",
  salaryLabel: "",
  description: "",
  published: true,
};

export function JobOrdersScreen() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyOpening);
  const [edit, setEdit] = useState(emptyEdit);
  const orders = useQuery({ queryKey: ["job-orders"], queryFn: async () => (await api<JobOrderView[]>("/api/job-orders")).data });
  const employers = useQuery({ queryKey: ["employers"], queryFn: async () => (await api<EmployerView[]>("/api/employers")).data });
  const publish = useMutation({
    mutationFn: async () =>
      api("/api/job-orders", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          vacancies: Number(form.vacancies),
          employmentType: "Full-time",
        }),
      }),
    onSuccess: async () => {
      toast.success("Job published on the careers site.");
      setOpen(false);
      setForm(emptyOpening);
      await queryClient.invalidateQueries({ queryKey: ["job-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["employers"] });
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The job could not be published."),
  });
  const save = useMutation({
    mutationFn: async () =>
      api(`/api/job-orders/${edit.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: edit.title,
          country: edit.country,
          vacancies: Number(edit.vacancies),
          category: edit.category,
          employmentType: edit.employmentType,
          salaryLabel: edit.salaryLabel,
          description: edit.description,
          published: edit.published,
        }),
      }),
    onSuccess: async () => {
      toast.success(edit.published ? "Job order saved and listed on the careers site." : "Job order saved. The careers listing is hidden.");
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["job-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The job order could not be saved."),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    publish.mutate();
  }

  function submitEdit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  function openEdit(order: JobOrderView) {
    setEdit({
      id: order.id,
      title: order.title,
      country: order.country,
      vacancies: String(order.vacancies),
      category: order.category,
      employmentType: order.employmentType || "Full-time",
      salaryLabel: order.salaryLabel,
      description: order.description,
      published: order.published,
    });
    setEditing(true);
  }

  return (
    <div>
      <PageHeader
        kicker="Employer and manpower demand"
        title="Job orders"
        description="Employers, requested vacancies, and publication channels."
        actions={<Button onClick={() => setOpen(true)}>Publish a job</Button>}
      />
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Job orders</TabsTrigger>
          <TabsTrigger value="employers">Employers</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <QueryState isLoading={orders.isLoading} isError={orders.isError} error={orders.error} isEmpty={orders.data?.length === 0} empty="No job orders yet.">
            <div className="overflow-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    {["Job order", "Country", "Vacancies", "Applicants", "Fulfillment", "Channels", "Status", "Listing", "Actions"].map((heading) => (
                      <th key={heading} className="px-3 py-3 font-medium">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.data?.map((order) => (
                    <tr key={order.id} className="border-t border-border">
                      <td className="px-3 py-3"><strong>{order.reference} · {order.title}</strong><br /><span className="text-xs text-muted-foreground">{order.employer}</span></td>
                      <td className="px-3 py-3">{order.country}</td>
                      <td className="px-3 py-3">{order.vacancies}</td>
                      <td className="px-3 py-3">{order.applicants}</td>
                      <td className="px-3 py-3">{order.fulfillmentPercent}%</td>
                      <td className="px-3 py-3"><span className="flex flex-wrap gap-1">{order.channels.map((channel) => <StatusBadge key={channel} value={channel} />)}</span></td>
                      <td className="px-3 py-3"><StatusBadge value={order.status} /></td>
                      <td className="px-3 py-3"><StatusBadge value={order.published ? "Published" : "Draft"} /></td>
                      <td className="px-3 py-3 text-right"><Button variant="outline" size="sm" onClick={() => openEdit(order)}>Edit</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </QueryState>
        </TabsContent>
        <TabsContent value="employers">
          <QueryState isLoading={employers.isLoading} isError={employers.isError} error={employers.error}>
            <div className="grid gap-3 md:grid-cols-2">
              {employers.data?.map((employer) => (
                <article key={employer.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{employer.name}</h2>
                      <p className="text-sm text-muted-foreground">{employer.country} · {employer.contactName}</p>
                    </div>
                    <StatusBadge value={employer.status} />
                  </div>
                  <p className="mt-3 text-sm">{employer.jobOrders} job orders</p>
                </article>
              ))}
            </div>
          </QueryState>
        </TabsContent>
      </Tabs>
      <IllustrativeNote>Fulfillment counts selected applications against requested vacancies. That counting rule is not confirmed.</IllustrativeNote>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish a job</DialogTitle>
            <DialogDescription>This saves the employer, job order, and a published careers listing.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-3">
            {([
              ["employerName", "Employer"],
              ["title", "Job title"],
              ["vacancies", "Vacancies"],
              ["category", "Category"],
              ["salaryLabel", "Compensation label"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type={key === "vacancies" ? "number" : "text"}
                  min={key === "vacancies" ? 1 : undefined}
                  value={form[key]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  required
                  className="mt-1 h-10"
                />
              </div>
            ))}
            <div>
              <Label htmlFor="country">Destination</Label>
              <select
                id="country"
                value={form.country}
                onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
                required
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {MIDDLE_EAST_COUNTRIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required rows={4} className="mt-1" />
            </div>
            <Button type="submit" disabled={publish.isPending}>{publish.isPending ? "Publishing…" : "Publish on the careers site"}</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit job order</DialogTitle>
            <DialogDescription>This updates the job order and the careers listing saved with it. A separate approval step is not configured.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEdit} className="grid gap-3">
            {([
              ["title", "Job title"],
              ["vacancies", "Vacancies"],
              ["category", "Category"],
              ["employmentType", "Employment type"],
              ["salaryLabel", "Compensation label"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={`edit-${key}`}>{label}</Label>
                <Input
                  id={`edit-${key}`}
                  type={key === "vacancies" ? "number" : "text"}
                  min={key === "vacancies" ? 1 : undefined}
                  value={edit[key]}
                  onChange={(event) => setEdit((current) => ({ ...current, [key]: event.target.value }))}
                  required
                  className="mt-1 h-10"
                />
              </div>
            ))}
            <div>
              <Label htmlFor="edit-country">Destination</Label>
              <select
                id="edit-country"
                value={edit.country}
                onChange={(event) => setEdit((current) => ({ ...current, country: event.target.value }))}
                required
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {MIDDLE_EAST_COUNTRIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={edit.description} onChange={(event) => setEdit((current) => ({ ...current, description: event.target.value }))} required rows={4} className="mt-1" />
            </div>
            <label className="flex items-center gap-2 text-sm" htmlFor="edit-published">
              <input
                id="edit-published"
                type="checkbox"
                checked={edit.published}
                onChange={(event) => setEdit((current) => ({ ...current, published: event.target.checked }))}
              />
              Show this job on the careers site
            </label>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save job order"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
