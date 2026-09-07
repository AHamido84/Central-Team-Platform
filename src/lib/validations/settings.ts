import { z } from "zod";
import { scopeItemCategoryValues } from "@/lib/validations/project";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "required").max(200, "maxLength"),
  locale: z.enum(["ar", "en"]),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const projectTypeSchema = z.object({
  name: z.string().trim().min(1, "required").max(120, "maxLength"),
  description: z.string().trim().max(500, "maxLength").optional().or(z.literal("")),
});

export type ProjectTypeFormValues = z.infer<typeof projectTypeSchema>;

export const requestTypeSchema = z.object({
  name: z.string().trim().min(1, "required").max(120, "maxLength"),
  description: z.string().trim().max(500, "maxLength").optional().or(z.literal("")),
  category: z.enum(scopeItemCategoryValues).optional().or(z.literal("")),
});

export type RequestTypeFormValues = z.infer<typeof requestTypeSchema>;
