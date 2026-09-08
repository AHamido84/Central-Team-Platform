import { z } from "zod";
import { priorityValues } from "@/lib/validations/project";

export const taskSchema = z.object({
  projectId: z.string().min(1, "required"),
  requestId: z.string().optional().or(z.literal("")),
  scopeItemId: z.string().optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(1, "required").max(200, "maxLength"),
  description: z.string().trim().max(2000, "maxLength").optional().or(z.literal("")),
  notes: z.string().trim().max(2000, "maxLength").optional().or(z.literal("")),
  assigneeId: z.string().optional().or(z.literal("")),
  priority: z.enum(priorityValues),
  estimatedHours: z.coerce.number().min(0).optional(),
  actualHours: z.coerce.number().min(0).optional(),
  startDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  dependsOnTaskIds: z.array(z.string()).optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
