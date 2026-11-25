import { notFound } from "next/navigation";
import { JobDetailScreen } from "@/features/public/job-detail-screen";
import { DataUnavailableError, getPublicJob } from "@/lib/data/repository";

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  try {
    const job = await getPublicJob(jobId);
    if (!job) notFound();
  } catch (error) {
    if (!(error instanceof DataUnavailableError)) throw error;
  }
  return <JobDetailScreen jobId={jobId} />;
}
