import type { Candidate } from "@/lib/data/types";

export type ProfileEntryCounts = { workExperienceCount: number; educationCount: number };

type CompletenessFields = Pick<Candidate, "fullName" | "mobile" | "dateOfBirth" | "nationality" | "preferredRole" | "languages" | "preferredDestination">;

/**
 * Work experience and education count once each when at least one entry exists.
 * The older single-line experience and education text does not count toward completion.
 */
export function profileCompleteness(candidate: CompletenessFields, counts: ProfileEntryCounts) {
  const checks = [
    candidate.fullName,
    candidate.mobile,
    candidate.dateOfBirth,
    candidate.nationality,
    candidate.preferredRole,
    candidate.languages,
    candidate.preferredDestination,
  ].map((value) => value.trim().length > 0);
  checks.push(counts.workExperienceCount > 0, counts.educationCount > 0);
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function monthToDate(month: string) {
  return `${month}-01`;
}

export function dateToMonth(value: string | null) {
  return value ? value.slice(0, 7) : "";
}
