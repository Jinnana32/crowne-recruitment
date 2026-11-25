import { cn } from "cn";

export function Progress({ value, className }: { value: number; className?: string }) {
  const safe = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
      className={cn("h-1.5 overflow-hidden rounded-full bg-royal-soft", className)}
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${safe}%` }} />
    </div>
  );
}
