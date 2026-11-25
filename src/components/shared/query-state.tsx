import type { ReactNode } from "react";

export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty,
  empty,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isEmpty?: boolean;
  empty?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) {
    return <p className="rounded-xl border border-border bg-card px-4 py-8 text-sm text-muted-foreground">Loading records…</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="rounded-xl border border-destructive/30 bg-card px-4 py-8 text-sm text-destructive">
        {error?.message ?? "The records could not be loaded."}
      </p>
    );
  }
  if (isEmpty) {
    return <div className="rounded-xl border border-border bg-card px-4 py-8 text-sm text-muted-foreground">{empty}</div>;
  }
  return children;
}
