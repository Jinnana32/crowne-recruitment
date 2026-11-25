import { cn } from "cn";

const tones: Record<string, string> = {
  Recruiting: "bg-royal-soft text-primary",
  Active: "bg-royal-soft text-primary",
  Website: "bg-success-soft text-success",
  Published: "bg-success-soft text-success",
  Draft: "bg-warning-soft text-warning",
  Selected: "bg-success-soft text-success",
  Ready: "bg-success-soft text-success",
  Posted: "bg-success-soft text-success",
  Approved: "bg-success-soft text-success",
  Verified: "bg-success-soft text-success",
  Passed: "bg-success-soft text-success",
  Done: "bg-success-soft text-success",
  "Ticket confirmed": "bg-success-soft text-success",
  "For review": "bg-warning-soft text-warning",
  "For processing": "bg-warning-soft text-warning",
  "On hold": "bg-warning-soft text-warning",
  Pending: "bg-warning-soft text-warning",
  "In progress": "bg-warning-soft text-warning",
  "Booking pending": "bg-warning-soft text-warning",
  "Clearance review": "bg-warning-soft text-warning",
  WorkAbroad: "bg-royal-soft text-primary",
  Rejected: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tones[value] ?? "bg-royal-soft text-primary",
      )}
    >
      {value}
    </span>
  );
}
