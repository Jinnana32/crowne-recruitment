import { Suspense } from "react";
import { JobsScreen } from "@/features/public/jobs-screen";

export default function JobsPage() {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-sm text-muted-foreground">Loading jobs…</p>}>
      <JobsScreen />
    </Suspense>
  );
}
