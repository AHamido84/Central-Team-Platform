import { z } from "zod";

export const opportunityStageValues = [
  "NEW",
  "QUALIFYING",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export const opportunitySchema = z.object({
  clientId: z.string().min(1, "required"),
  projectId: z.string().optional().or(z.literal("")),
  leadId: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(1, "required").max(200, "maxLength"),
  value: z.coerce.number().min(0).optional(),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional().or(z.literal("")),
  ownerId: z.string().optional().or(z.literal("")),
});

export type OpportunityFormValues = z.infer<typeof opportunitySchema>;
