import { z } from "zod";

export const clientStatusValues = ["ACTIVE", "INACTIVE", "PROSPECT", "ON_HOLD", "ARCHIVED"] as const;

export const clientSchema = z.object({
  companyName: z.string().trim().min(1, "required").max(200, "maxLength"),
  legalName: z.string().trim().max(200, "maxLength").optional().or(z.literal("")),
  commercialRegistration: z.string().trim().max(50, "maxLength").optional().or(z.literal("")),
  taxNumber: z.string().trim().max(50, "maxLength").optional().or(z.literal("")),
  industry: z.string().trim().max(120, "maxLength").optional().or(z.literal("")),
  website: z.string().trim().url("invalidUrl").optional().or(z.literal("")),
  email: z.string().trim().email("invalidEmail").optional().or(z.literal("")),
  phone: z.string().trim().max(40, "maxLength").optional().or(z.literal("")),
  address: z.string().trim().max(500, "maxLength").optional().or(z.literal("")),
  country: z.string().trim().max(100, "maxLength").optional().or(z.literal("")),
  city: z.string().trim().max(100, "maxLength").optional().or(z.literal("")),
  accountManagerId: z.string().optional().or(z.literal("")),
  status: z.enum(clientStatusValues),
  notes: z.string().trim().max(2000, "maxLength").optional().or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
