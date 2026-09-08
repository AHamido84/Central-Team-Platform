import { z } from "zod";
import { priorityValues } from "@/lib/validations/project";

export const templateFieldTypeValues = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DECIMAL",
  "DATE",
  "DATETIME",
  "CHECKBOX",
  "RADIO",
  "SELECT",
  "MULTI_SELECT",
  "EMAIL",
  "PHONE",
  "URL",
  "FILE",
  "COLOR",
] as const;

/** Field types that need an options list (Field Options, spec §15). */
export const OPTION_BASED_FIELD_TYPES = ["SELECT", "RADIO", "MULTI_SELECT"] as const;

export const templateFieldOptionSchema = z.object({
  labelAr: z.string().trim().min(1, "required").max(100, "maxLength"),
  labelEn: z.string().trim().min(1, "required").max(100, "maxLength"),
  value: z.string().trim().min(1, "required").max(100, "maxLength"),
  order: z.number().int().min(0),
  isActive: z.boolean(),
});

export const templateFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "required")
    .max(60, "maxLength")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "invalidKey"),
  labelAr: z.string().trim().min(1, "required").max(150, "maxLength"),
  labelEn: z.string().trim().min(1, "required").max(150, "maxLength"),
  description: z.string().trim().max(500, "maxLength").optional().or(z.literal("")),
  placeholder: z.string().trim().max(150, "maxLength").optional().or(z.literal("")),
  type: z.enum(templateFieldTypeValues),
  required: z.boolean(),
  order: z.number().int().min(0),
  defaultValue: z.string().trim().max(500, "maxLength").optional().or(z.literal("")),
  minValue: z.number().optional().nullable(),
  maxValue: z.number().optional().nullable(),
  minLength: z.number().int().min(0).optional().nullable(),
  maxLength: z.number().int().min(0).optional().nullable(),
  visibleIfFieldKey: z.string().trim().optional().nullable(),
  visibleIfValue: z.string().trim().optional().nullable(),
  options: z.array(templateFieldOptionSchema).optional(),
});

export const templateSectionSchema = z.object({
  titleAr: z.string().trim().min(1, "required").max(150, "maxLength"),
  titleEn: z.string().trim().min(1, "required").max(150, "maxLength"),
  order: z.number().int().min(0),
  fields: z.array(templateFieldSchema),
});

export const templateTaskSchema = z.object({
  order: z.number().int().min(0),
  titleAr: z.string().trim().min(1, "required").max(200, "maxLength"),
  titleEn: z.string().trim().min(1, "required").max(200, "maxLength"),
  description: z.string().trim().max(1000, "maxLength").optional().or(z.literal("")),
  departmentId: z.string().trim().optional().or(z.literal("")).nullable(),
  defaultPriority: z.enum(priorityValues),
  defaultEstimatedHours: z.number().min(0).optional().nullable(),
  clientVisible: z.boolean(),
  dependsOnOrder: z.number().int().min(0).optional().nullable(),
});

export const templateBasicInfoSchema = z.object({
  requestTypeId: z.string().min(1, "required"),
  icon: z.string().trim().max(10, "maxLength").optional().or(z.literal("")),
  nameAr: z.string().trim().min(1, "required").max(200, "maxLength"),
  nameEn: z.string().trim().min(1, "required").max(200, "maxLength"),
  descriptionAr: z.string().trim().max(1000, "maxLength").optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(1000, "maxLength").optional().or(z.literal("")),
  defaultPriority: z.enum(priorityValues),
  defaultDurationDays: z.number().int().min(0).optional().nullable(),
});

/** The whole builder's local state, submitted as one JSON blob whenever the
 * draft is saved or published — same "whole-array resubmit" convention as
 * every other builder in this app (scope items, task templates). */
export const templateDraftSchema = z.object({
  basicInfo: templateBasicInfoSchema,
  sections: z.array(templateSectionSchema).min(1, "required"),
  tasks: z.array(templateTaskSchema),
});

export type TemplateDraftValues = z.infer<typeof templateDraftSchema>;
export type TemplateSectionValues = z.infer<typeof templateSectionSchema>;
export type TemplateFieldValues = z.infer<typeof templateFieldSchema>;
export type TemplateTaskValues = z.infer<typeof templateTaskSchema>;

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
