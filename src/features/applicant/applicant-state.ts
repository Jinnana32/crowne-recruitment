import type { ApplicationStage } from "@/lib/domain/stages";
import type { ProfileEntryCounts } from "@/lib/domain/profile";

export const EDITABLE_PROFILE_FIELDS = [
  { key: "fullName", label: "Full name", prompt: "Add your full name so the recruitment team can identify your account." },
  { key: "mobile", label: "Mobile number", prompt: "Add a mobile number the recruitment team can use." },
  { key: "dateOfBirth", label: "Date of birth", prompt: "Add your date of birth." },
  { key: "nationality", label: "Nationality", prompt: "Add your nationality." },
  { key: "preferredRole", label: "Preferred role", prompt: "Add the role you want to be considered for." },
  { key: "languages", label: "Languages", prompt: "Add the languages you speak." },
  { key: "preferredDestination", label: "Preferred destination", prompt: "Add a preferred destination." },
] as const;

export type EditableProfileKey = (typeof EDITABLE_PROFILE_FIELDS)[number]["key"];

const ENTRY_GAPS = [
  { key: "workExperience", count: "workExperienceCount", label: "Work experience", prompt: "Add at least one work experience entry." },
  { key: "education", count: "educationCount", label: "Education", prompt: "Add at least one education entry." },
] as const;

export type ProfileGap = { key: string; label: string; prompt: string };

export const FORWARD_STAGES = [
  "New application",
  "Screening",
  "Shortlisted",
  "Employer review",
  "Selected",
  "Processing",
] as const satisfies readonly ApplicationStage[];

const INACTIVE_STAGES = new Set<ApplicationStage>(["Rejected", "Withdrawn"]);

export function emptyProfileFields(profile: Record<EditableProfileKey, string> & ProfileEntryCounts): ProfileGap[] {
  const fields: ProfileGap[] = EDITABLE_PROFILE_FIELDS.filter((field) => profile[field.key].trim().length === 0);
  const entries: ProfileGap[] = ENTRY_GAPS.filter((gap) => profile[gap.count] === 0);
  return [...fields, ...entries];
}

export function activeApplicationCount(stages: ApplicationStage[]) {
  return stages.filter((stage) => !INACTIVE_STAGES.has(stage)).length;
}

export function stageProgress(stage: ApplicationStage) {
  const index = (FORWARD_STAGES as readonly ApplicationStage[]).indexOf(stage);
  if (index === -1) return null;
  return { index, total: FORWARD_STAGES.length };
}

export const APPLICANT_TRACK = [
  { label: "Applied", stages: ["New application"] },
  { label: "Screening", stages: ["Screening"] },
  { label: "Review", stages: ["Shortlisted", "Employer review"] },
  { label: "Selection", stages: ["Selected"] },
  { label: "Processing", stages: ["Processing"] },
] as const satisfies readonly { label: string; stages: readonly ApplicationStage[] }[];

export function applicantTrackIndex(stage: ApplicationStage) {
  const index = APPLICANT_TRACK.findIndex((step) => (step.stages as readonly ApplicationStage[]).includes(stage));
  return index === -1 ? null : index;
}
