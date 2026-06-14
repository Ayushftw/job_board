import { z } from "zod";

export const createResumeSchema = z.object({
  name: z.string().min(1),
  fileUrl: z.string().url(),
  fileKey: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

export const updateResumeSchema = z.object({
  name: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
