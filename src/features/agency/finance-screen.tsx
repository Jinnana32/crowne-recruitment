"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Download,
  Plus,
  Receipt,
  Search,
  Stethoscope,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { IllustrativeNote } from "@/components/shared/illustrative-note";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/browser";
import { centsFromDecimal, formatPeso } from "@/lib/domain/money";
import type { FinanceTransaction } from "@/lib/data/types";
import { cn } from "cn";

type Tab = "all" | "income" | "expense" | "pending";

const PAGE_SIZE = 10;

function transactionIcon(description: string) {
  const value = description.toLowerCase();
  if (value.includes("medical")) return Stethoscope;
  if (value.includes("placement") || value.includes("employer")) return Building2;
  if (value.includes("office") || value.includes("supply")) return Receipt;
  return Wallet;
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function weekBuckets(transactions: FinanceTransaction[]) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const labels: string[] = [];
  const points: Array<{ label: string; income: number; expense: number }> = [];
  for (let day = 1; day <= 29; day += 7) {
    const anchor = new Date(start.getFullYear(), start.getMonth(), day);
    const label = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(anchor);
    labels.push(label);
    const end = new Date(start.getFullYear(), start.getMonth(), day + 6, 23, 59, 59);
    let income = 0;
    let expense = 0;
    for (const item of transactions) {
      const recorded = new Date(`${item.recordedOn}T12:00:00`);
      if (recorded < anchor || recorded > end) continue;
      const cents = centsFromDecimal(item.amountDecimal);
      if (item.kind === "income") income += cents;
      else expense += cents;
    }
    points.push({ label, income, expense });
  }
  return points;
}

export function FinanceScreen() {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const transactions = useQuery({
    queryKey: ["finance"],
    queryFn: async () => (await api<FinanceTransaction[]>("/api/finance")).data,
  });

  const rows = useMemo(() => transactions.data ?? [], [transactions.data]);
  const income = rows.filter((item) => item.kind === "income").reduce((sum, item) => sum + centsFromDecimal(item.amountDecimal), 0);
  const expenses = rows.filter((item) => item.kind === "expense").reduce((sum, item) => sum + centsFromDecimal(item.amountDecimal), 0);
  const net = income - expenses;
  const chart = useMemo(() => weekBuckets(rows), [rows]);
  const chartMax = Math.max(1, ...chart.flatMap((point) => [point.income, point.expense]));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((item) => {
      if (tab === "income" && item.kind !== "income") return false;
      if (tab === "expense" && item.kind !== "expense") return false;
      if (tab === "pending" && item.status !== "For review") return false;
      if (kindFilter && item.kind !== kindFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (!needle) return true;
      const haystack = `${item.description} ${item.reference} ${item.relatedRecord}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, tab, query, kindFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  const monthLabel = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const periodStart = monthLabel.format(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const periodEnd = monthLabel.format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

  function exportCsv() {
    const lines = [
      "description,reference,related_record,date,amount,currency,status,kind",
      ...filtered.map((item) =>
        [
          item.description,
          item.reference,
          item.relatedRecord,
          item.recordedOn,
          item.kind === "expense" ? `-${item.amountDecimal}` : item.amountDecimal,
          item.currency,
          item.status,
          item.kind,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "crowne-finance.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "all", label: "All Transactions" },
    { id: "income", label: "Income" },
    { id: "expense", label: "Expenses" },
    { id: "pending", label: "Pending Review" },
  ];

  return (
    <div data-finance>
      <PageHeader
        kicker="Financial operations"
        title="Finance"
        description="Track operational income, expenses, and transaction status."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span
              title="Date filtering is illustrative for this period."
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground"
            >
              <CalendarDays className="size-4" />
              {periodStart} – {periodEnd}
            </span>
            <Button
              type="button"
              className="h-10 gap-1.5"
              onClick={() => toast.message("Manual transaction entry is not available yet.")}
            >
              <Plus className="size-4" />
              Add Transaction
            </Button>
          </div>
        }
      />

      <QueryState isLoading={transactions.isLoading} isError={transactions.isError} error={transactions.error}>
        <div className="grid gap-5">
          <section data-finance-summary className="grid gap-3 xl:grid-cols-[1.05fr_0.7fr_0.7fr_1.15fr]">
            <article className="relative overflow-hidden rounded-2xl bg-primary p-5 text-white shadow-xs sm:p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(244,207,54,0.22),transparent_58%)]"
              />
              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-white/70">Net recorded amount</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">{formatPeso(net)}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
                  Operational · PHP
                </span>
              </div>
            </article>

            <article className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Recorded income</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-foreground">{formatPeso(income)}</p>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-success-soft text-success">
                  <ArrowDownLeft className="size-5" />
                </span>
              </div>
            </article>

            <article className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Recorded expenses</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-foreground">{formatPeso(expenses)}</p>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
                  <ArrowUpRight className="size-5" />
                </span>
              </div>
            </article>

            <article className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">Income vs. Expenses</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" />
                    Income
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#C5CEE8]" />
                    Expenses
                  </span>
                </div>
              </div>
              <div className="flex h-28 items-end gap-3">
                {chart.map((point) => (
                  <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-20 w-full items-end justify-center gap-1">
                      <span
                        className="w-2.5 rounded-t-sm bg-primary transition-[height] duration-500"
                        style={{
                          height: point.income === 0 ? "0%" : `${Math.max(8, Math.round((point.income / chartMax) * 100))}%`,
                        }}
                        title={`Income ${formatPeso(point.income)}`}
                      />
                      <span
                        className="w-2.5 rounded-t-sm bg-[#C5CEE8] transition-[height] duration-500"
                        style={{
                          height: point.expense === 0 ? "0%" : `${Math.max(8, Math.round((point.expense / chartMax) * 100))}%`,
                        }}
                        title={`Expenses ${formatPeso(point.expense)}`}
                      />
                    </div>
                    <span className="truncate text-[10px] text-muted-foreground">{point.label.replace(/,.*/, "")}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section data-finance-ledger className="rounded-2xl bg-card shadow-xs ring-1 ring-border">
            <div className="border-b border-border px-4 pt-3 sm:px-5">
              <div className="flex gap-4 overflow-x-auto">
                {tabs.map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTab(item.id);
                        setPage(1);
                      }}
                      className={cn(
                        "relative shrink-0 pb-3 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.label}
                      {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:px-5">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by transaction, reference, candidate, or job order"
                  className="h-10 bg-background pl-9"
                />
              </div>
              <select
                value={kindFilter}
                onChange={(event) => {
                  setKindFilter(event.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                aria-label="Transaction type"
              >
                <option value="">Transaction type</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                aria-label="Status"
              >
                <option value="">Status</option>
                <option value="Posted">Posted</option>
                <option value="Approved">Approved</option>
                <option value="For review">For review</option>
              </select>
              <Button type="button" variant="outline" className="h-10 gap-1.5" onClick={exportCsv} disabled={filtered.length === 0}>
                <Download className="size-4" />
                Export
              </Button>
            </div>

            {filtered.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">No transactions match these filters.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-royal-soft/60 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    <tr>
                      {["Transaction", "Reference", "Related record", "Date", "Amount", "Status"].map((heading) => (
                        <th key={heading} className="px-5 py-3 font-semibold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((transaction) => {
                      const Icon = transactionIcon(transaction.description);
                      const cents = centsFromDecimal(transaction.amountDecimal);
                      const incomeRow = transaction.kind === "income";
                      return (
                        <tr key={transaction.id} className="border-t border-border transition-colors hover:bg-royal-soft/30">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "grid size-9 shrink-0 place-items-center rounded-xl",
                                  incomeRow ? "bg-success-soft text-success" : "bg-destructive/10 text-destructive",
                                )}
                              >
                                <Icon className="size-4" />
                              </span>
                              <span className="font-semibold text-foreground">{transaction.description}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{transaction.reference}</td>
                          <td className="px-5 py-3.5 text-foreground">{transaction.relatedRecord || "—"}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{formatShortDate(transaction.recordedOn)}</td>
                          <td
                            className={cn(
                              "px-5 py-3.5 font-semibold tabular-nums",
                              incomeRow ? "text-success" : "text-destructive",
                            )}
                          >
                            {incomeRow ? "+" : "−"} {formatPeso(cents)}
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge value={transaction.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {rangeStart}–{rangeEnd} of {filtered.length} transactions
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs">Rows per page: {PAGE_SIZE}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-white">
                  {pageSafe}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={pageSafe >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        </div>
      </QueryState>

      <IllustrativeNote>
        Amounts use PHP and two decimal places. Passing medical on Processing posts a provisional expense; scheduling departure posts a provisional employer placement fee. Full accounting remains an open scope decision.
      </IllustrativeNote>
    </div>
  );
}
