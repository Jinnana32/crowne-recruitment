export const APPLICATION_STAGES = [
  "New application",
  "Screening",
  "Shortlisted",
  "Employer review",
  "Selected",
  "Processing",
  "Rejected",
  "On hold",
  "Withdrawn",
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const PIPELINE_COLUMNS: ApplicationStage[] = [
  "New application",
  "Screening",
  "Shortlisted",
  "Employer review",
  "Selected",
];

export function isApplicationStage(value: string): value is ApplicationStage {
  return APPLICATION_STAGES.some((stage) => stage === value);
}

export const FULFILLMENT_NOTE =
  "Fulfillment counts employer-selected applications against requested vacancies. Crowne has not confirmed this counting rule.";

export function fulfillmentPercent(selected: number, vacancies: number) {
  if (vacancies <= 0) return 0;
  return Math.round((selected / vacancies) * 100);
}
