import { z } from "zod";

export const createRequestSchema = z.object({
  projectId: z.string().trim().optional().or(z.literal("")),
  requestTypeId: z.string().min(1, "required"),
  title: z.string().trim().min(1, "required").max(200, "maxLength"),
  description: z.string().trim().max(2000, "maxLength").optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});

export type CreateRequestValues = z.infer<typeof createRequestSchema>;
