import { z } from "zod";
import { scopeItemCategoryValues } from "@/lib/validations/project";

export const deliverableSchema = z.object({
  projectId: z.string().min(1, "required"),
  taskId: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(1, "required").max(200, "maxLength"),
  description: z.string().trim().max(2000, "maxLength").optional().or(z.literal("")),
  category: z.enum(scopeItemCategoryValues).optional().or(z.literal("")),
  type: z.string().trim().max(50, "maxLength").optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  fileName: z.string().trim().min(1, "required").max(200, "maxLength"),
  fileUrl: z.string().trim().min(1, "required").max(2000, "maxLength"),
  supersedesId: z.string().optional().or(z.literal("")),
});

export type DeliverableFormValues = z.infer<typeof deliverableSchema>;
