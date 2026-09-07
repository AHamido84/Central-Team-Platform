import { z } from "zod";

export const leadStatusValues = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "DISQUALIFIED",
  "CONVERTED",
] as const;

export const leadSchema = z.object({
  clientId: z.string().min(1, "required"),
  projectId: z.string().optional().or(z.literal("")),
  campaignId: z.string().optional().or(z.literal("")),
  name: z.string().trim().min(1, "required").max(200, "maxLength"),
  email: z.string().trim().email("invalidEmail").optional().or(z.literal("")),
  phone: z.string().trim().max(40, "maxLength").optional().or(z.literal("")),
  source: z.string().trim().max(120, "maxLength").optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
});

export type LeadFormValues = z.infer<typeof leadSchema>;
