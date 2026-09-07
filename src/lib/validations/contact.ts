import { z } from "zod";

export const contactMethodValues = ["EMAIL", "PHONE", "WHATSAPP"] as const;
export const contactStatusValues = ["ACTIVE", "ARCHIVED"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "required").max(200, "maxLength"),
  position: z.string().trim().max(120, "maxLength").optional().or(z.literal("")),
  department: z.string().trim().max(120, "maxLength").optional().or(z.literal("")),
  email: z.string().trim().email("invalidEmail").optional().or(z.literal("")),
  phone: z.string().trim().max(40, "maxLength").optional().or(z.literal("")),
  whatsapp: z.string().trim().max(40, "maxLength").optional().or(z.literal("")),
  preferredContactMethod: z.enum(contactMethodValues).optional().or(z.literal("")),
  notes: z.string().trim().max(1000, "maxLength").optional().or(z.literal("")),
  isPrimary: z.boolean().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
