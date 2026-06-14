import { z } from "zod";

export const applicationStatusSchema = z.enum([
  "APPLIED",
  "SCREENING",
  "TECHNICAL",
  "MANAGER_ROUND",
  "FINAL_ROUND",
  "OFFER",
  "REJECTED",
]);

export const createApplicationSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  jobUrl: z.string().url().optional().or(z.literal("")),
  salary: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  recruiterName: z.string().optional(),
  recruiterEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  jobDescription: z.string().optional(),
  status: applicationStatusSchema.optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial();

export const updateStatusSchema = z.object({
  status: applicationStatusSchema,
});

export const applicationQuerySchema = z.object({
  search: z.string().optional(),
  status: applicationStatusSchema.optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const createInterviewSchema = z.object({
  stage: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationQueryInput = z.infer<typeof applicationQuerySchema>;
