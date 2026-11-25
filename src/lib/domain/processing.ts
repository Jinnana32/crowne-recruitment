import type { ChecklistItem } from "@/lib/data/types";

/** Provisional Middle East checklist until Crowne confirms country/employer rules (D-016). */
export const DEFAULT_PROCESSING_CHECKLIST: Array<ChecklistItem & { sensitivity: "standard" | "medical" }> = [
  { label: "Passport verification", state: "Pending", sensitivity: "standard" },
  { label: "Police clearance", state: "Pending", sensitivity: "standard" },
  { label: "Medical examination", state: "Pending", sensitivity: "medical" },
  { label: "Employment contract", state: "Pending", sensitivity: "standard" },
  { label: "Pre-departure orientation", state: "Pending", sensitivity: "standard" },
];

export const MEDICAL_CHECKLIST_LABEL = "Medical examination";

/** Provisional demo amounts in PHP — not Crowne fee schedule. */
export const DEMO_MEDICAL_EXPENSE = "4500.00";
export const DEMO_PLACEMENT_INCOME = "180000.00";

export type ChecklistState = ChecklistItem["state"];

export function nextChecklistState(label: string, current: ChecklistState): ChecklistState {
  if (current === "Pending") return label === MEDICAL_CHECKLIST_LABEL ? "Passed" : "Done";
  return "Pending";
}

export function isChecklistComplete(checklist: ChecklistItem[]) {
  return checklist.length > 0 && checklist.every((item) => item.state !== "Pending");
}

export function nextActionFromChecklist(checklist: ChecklistItem[]) {
  const pending = checklist.find((item) => item.state === "Pending");
  if (pending) return pending.label;
  return "Mark ready for deployment";
}

export function checklistCompletionPercent(checklist: ChecklistItem[]) {
  if (checklist.length === 0) return 0;
  const done = checklist.filter((item) => item.state !== "Pending").length;
  return Math.round((done / checklist.length) * 100);
}
