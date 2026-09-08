import { z } from "zod";
import { priorityValues } from "@/lib/validations/project";

export const createRequestSchema = z.object({
  projectId: z.string().trim().optional().or(z.literal("")),
  scopeItemId: z.string().trim().optional().or(z.literal("")),
  campaignId: z.string().trim().optional().or(z.literal("")),
  requestTypeId: z.string().min(1, "required"),
  title: z.string().trim().min(1, "required").max(200, "maxLength"),
  description: z.string().trim().max(2000, "maxLength").optional().or(z.literal("")),
  notes: z.string().trim().max(2000, "maxLength").optional().or(z.literal("")),
  priority: z.enum(priorityValues).optional(),
  requestedDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});

export type CreateRequestValues = z.infer<typeof createRequestSchema>;
