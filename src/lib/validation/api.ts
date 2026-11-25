import { z } from "zod";
import { MIDDLE_EAST_COUNTRIES } from "@/lib/domain/countries";

const middleEastCountry = z.enum(MIDDLE_EAST_COUNTRIES);

export const sessionSchema = z.object({
  mode: z.enum(["login", "register"]).default("login"),
  role: z.enum(["applicant", "staff"]).optional(),
  email: z.email(),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : undefined)),
  password: z.string().min(8).max(200).optional(),
});

export const jobOpeningSchema = z.object({
  employerName: z.string().trim().min(1).max(160),
  country: middleEastCountry,
  title: z.string().trim().min(1).max(120),
  vacancies: z.number().int().positive().max(10_000),
  category: z.string().trim().min(1).max(80),
  employmentType: z.string().trim().min(1).max(40).default("Full-time"),
  salaryLabel: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(2_000),
});

export const jobOrderUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  country: middleEastCountry,
  vacancies: z.number().int().positive().max(10_000),
  category: z.string().trim().min(1).max(80),
  employmentType: z.string().trim().min(1).max(40),
  salaryLabel: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(2_000),
  published: z.boolean(),
});

export const checklistItemUpdateSchema = z.object({
  label: z.string().trim().min(1).max(120),
  state: z.enum(["Pending", "Done", "Passed"]),
});

export const markProcessingReadySchema = z.object({
  markReady: z.literal(true),
});

export const createDeploymentSchema = z.object({
  processingId: z.string().trim().min(1),
  departureDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a calendar date."),
});

export const deploymentUpdateSchema = z.object({
  travelStatus: z.enum(["Ticket confirmed", "Booking pending", "Not booked"]).optional(),
  readiness: z.enum(["Ready", "Clearance review"]).optional(),
}).refine((value) => value.travelStatus !== undefined || value.readiness !== undefined, {
  message: "Choose a travel or readiness update.",
});

export const applicationSchema = z.object({
  publicationId: z.string().trim().min(1),
});

export const stageSchema = z.object({
  stage: z.enum([
    "New application",
    "Screening",
    "Shortlisted",
    "Employer review",
    "Selected",
    "Processing",
    "Rejected",
    "On hold",
    "Withdrawn",
  ]),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  mobile: z.string().trim().max(40).optional(),
  preferredRole: z.string().trim().max(80).optional(),
  experience: z.string().trim().max(80).optional(),
  education: z.string().trim().max(120).optional(),
  languages: z.string().trim().max(120).optional(),
  preferredDestination: z.union([z.literal(""), middleEastCountry]).optional(),
  dateOfBirth: z.string().trim().regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Use a calendar date.").optional(),
  nationality: z.string().trim().max(80).optional(),
});

const month = z.string().trim().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use a month and year.");

function endsAfterStart(value: { startMonth: string; endMonth?: string; isCurrent: boolean }, context: z.RefinementCtx) {
  if (value.isCurrent) return;
  if (!value.endMonth) {
    context.addIssue({ code: "custom", path: ["endMonth"], message: "Add an end month." });
  } else if (value.endMonth < value.startMonth) {
    context.addIssue({ code: "custom", path: ["endMonth"], message: "The end month is before the start month." });
  }
}

export const workExperienceSchema = z
  .object({
    jobTitle: z.string().trim().min(1).max(120),
    employerName: z.string().trim().min(1).max(160),
    country: z.string().trim().max(80).default(""),
    startMonth: month,
    endMonth: month.or(z.literal("")).optional(),
    isCurrent: z.boolean().default(false),
    description: z.string().trim().max(600).default(""),
  })
  .superRefine(endsAfterStart);

export const educationSchema = z
  .object({
    qualification: z.string().trim().min(1).max(120),
    school: z.string().trim().min(1).max(160),
    fieldOfStudy: z.string().trim().max(120).default(""),
    startMonth: month,
    endMonth: month.or(z.literal("")).optional(),
    isCurrent: z.boolean().default(false),
  })
  .superRefine(endsAfterStart);

export type WorkExperienceInput = z.infer<typeof workExperienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;

export const documentUploadFieldsSchema = z.object({
  name: z.string().trim().max(160, "Use 160 characters or fewer for the document name.").optional().default(""),
  requestId: z.string().trim().max(64).optional().default(""),
});

export const documentRequestSchema = z.object({
  name: z.string().trim().min(1, "Enter the document name.").max(120, "Use 120 characters or fewer for the document name."),
  description: z.string().trim().max(300, "Use 300 characters or fewer for the description.").optional().default(""),
  sensitivity: z.enum(["standard", "medical"]).default("standard"),
});

export const documentReviewSchema = z.object({
  status: z.enum(["For review", "Verified"]),
});

export type DocumentRequestInput = z.infer<typeof documentRequestSchema>;

export const importSchema = z.object({
  csv: z.string().trim().min(1).max(100_000),
});
