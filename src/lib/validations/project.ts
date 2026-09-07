import { z } from "zod";

export const projectStatusValues = [
  "PLANNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
] as const;

export const priorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const projectSchema = z.object({
  clientId: z.string().min(1, "required"),
  contractId: z.string().optional().or(z.literal("")),
  projectTypeId: z.string().min(1, "required"),
  name: z.string().trim().min(1, "required").max(200, "maxLength"),
  projectCode: z.string().trim().max(50, "maxLength").optional().or(z.literal("")),
  description: z.string().trim().max(2000, "maxLength").optional().or(z.literal("")),
  status: z.enum(projectStatusValues),
  priority: z.enum(priorityValues),
  startDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional(),
  currency: z.string().trim().max(10, "maxLength").optional().or(z.literal("")),
  ownerId: z.string().optional().or(z.literal("")),
  accountManagerId: z.string().optional().or(z.literal("")),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const scopeItemCategoryValues = [
  "DESIGN",
  "VIDEO",
  "VOICE_OVER",
  "COPYWRITING",
  "PHOTOGRAPHY",
  "BROCHURE",
  "WEBSITE",
  "LANDING_PAGE",
  "SEO",
  "MARKETING_STRATEGY",
  "ADVERTISING",
  "MEDIA_BUYING",
  "COMMUNITY_MANAGEMENT",
  "LEAD_GENERATION",
  "SALES_SUPPORT",
  "REPORTING",
  "OTHER",
] as const;

export const scopeProgressModeValues = ["QUANTITY", "TASK_BASED", "MANUAL", "WEIGHTED"] as const;

export const scopeItemSchema = z.object({
  category: z.enum(scopeItemCategoryValues),
  name: z.string().trim().min(1, "required").max(200, "maxLength"),
  description: z.string().trim().max(1000, "maxLength").optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(0).optional(),
  unit: z.string().trim().max(50, "maxLength").optional().or(z.literal("")),
  estimatedHours: z.coerce.number().min(0).optional(),
  progressMode: z.enum(scopeProgressModeValues).optional(),
  manualProgressPercent: z.coerce.number().int().min(0).max(100).optional(),
  weight: z.coerce.number().min(0).optional(),
  dueDate: z.string().optional().or(z.literal("")),
});

export type ScopeItemFormValues = z.infer<typeof scopeItemSchema>;
