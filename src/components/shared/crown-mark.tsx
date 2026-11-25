import { cn } from "cn";

export function CrownMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 place-items-center rounded-[10px] bg-gold font-serif text-lg text-primary",
        className,
      )}
    >
      ♛
    </span>
  );
}
