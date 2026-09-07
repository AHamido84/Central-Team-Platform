import { z } from "zod";
import { priorityValues } from "@/lib/validations/project";

export const taskSchema = z.object({
  projectId: z.string().min(1, "required"),
  scopeItemId: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(1, "required").max(200, "maxLength"),
  description: z.string().trim().max(2000, "maxLength").optional().or(z.literal("")),
  assigneeId: z.string().optional().or(z.literal("")),
  priority: z.enum(priorityValues),
  dueDate: z.string().optional().or(z.literal("")),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
