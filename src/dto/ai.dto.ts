import { z } from "zod";

export const matchScoreSchema = z.object({
  resumeId: z.string().min(1),
  applicationId: z.string().min(1).optional(),
  jobDescription: z.string().min(10).optional(),
});

export const interviewPrepSchema = z.object({
  applicationId: z.string().min(1),
});

export const generateMessageSchema = z.object({
  type: z.enum(["REFERRAL", "FOLLOW_UP", "OUTREACH", "THANK_YOU"]),
  applicationId: z.string().optional(),
  context: z.string().min(10),
});

export type MatchScoreInput = z.infer<typeof matchScoreSchema>;
export type InterviewPrepInput = z.infer<typeof interviewPrepSchema>;
export type GenerateMessageInput = z.infer<typeof generateMessageSchema>;
