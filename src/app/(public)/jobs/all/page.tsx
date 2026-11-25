import { Suspense } from "react";
import { JobsAllScreen } from "@/features/public/jobs-screen";

export default function JobsAllPage() {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-sm text-muted-foreground">Loading jobs…</p>}>
      <JobsAllScreen />
    </Suspense>
  );
}
