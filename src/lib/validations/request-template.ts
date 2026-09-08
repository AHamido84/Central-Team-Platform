import { z } from "zod";
import { priorityValues } from "@/lib/validations/project";
import { scopeItemCategoryValues } from "@/lib/validations/project";

export const templateItemSchema = z.object({
  order: z.number().int().min(0),
  title: z.string().trim().min(1, "required").max(200, "maxLength"),
  description: z.string().trim().max(1000, "maxLength").optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  defaultPriority: z.enum(priorityValues),
  defaultEstimatedHours: z.number().min(0).optional(),
  dependsOnOrder: z.number().int().min(0).optional().nullable(),
});

export const requestTemplateSchema = z.object({
  name: z.string().trim().min(1, "required").max(200, "maxLength"),
  category: z.enum(scopeItemCategoryValues).optional(),
  description: z.string().trim().max(1000, "maxLength").optional().or(z.literal("")),
  items: z.array(templateItemSchema).min(1, "required"),
});

export type RequestTemplateFormValues = z.infer<typeof requestTemplateSchema>;

/** One row of the "review & edit generated tasks" draft screen — pre-filled
 * from a template (or started blank), freely editable, then submitted as one
 * transaction by generateTasksFromTemplateAction. `key` is a client-side-only
 * identifier used to resolve dependsOnKeys into real Task ids after creation. */
export const taskDraftSchema = z.object({
  key: z.string().min(1),
  title: z.string().trim().min(1, "required").max(200, "maxLength"),
  description: z.string().trim().max(1000, "maxLength").optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  assigneeId: z.string().optional().or(z.literal("")),
  priority: z.enum(priorityValues),
  estimatedHours: z.number().min(0).optional(),
  startDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  dependsOnKeys: z.array(z.string()).optional(),
});

export const taskDraftListSchema = z.array(taskDraftSchema).min(1, "required");

export type TaskDraft = z.infer<typeof taskDraftSchema>;
