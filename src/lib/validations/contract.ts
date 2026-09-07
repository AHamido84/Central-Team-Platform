import { z } from "zod";

export const contractStatusValues = [
  "DRAFT",
  "PENDING_APPROVAL",
  "ACTIVE",
  "EXPIRED",
  "TERMINATED",
  "CANCELLED",
  "ARCHIVED",
] as const;

export const contractSchema = z.object({
  clientId: z.string().min(1, "required"),
  title: z.string().trim().min(1, "required").max(200, "maxLength"),
  contractNumber: z.string().trim().max(50, "maxLength").optional().or(z.literal("")),
  type: z.string().trim().max(120, "maxLength").optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  value: z.coerce.number().min(0).optional(),
  currency: z.string().trim().max(10, "maxLength").optional().or(z.literal("")),
  paymentTerms: z.string().trim().max(500, "maxLength").optional().or(z.literal("")),
  status: z.enum(contractStatusValues),
  fileUrl: z.string().trim().max(2000, "maxLength").optional().or(z.literal("")),
  notes: z.string().trim().max(2000, "maxLength").optional().or(z.literal("")),
});

export type ContractFormValues = z.infer<typeof contractSchema>;
