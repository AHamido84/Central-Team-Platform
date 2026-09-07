import { z } from "zod";

export const campaignPlatformValues = [
  "META",
  "GOOGLE",
  "TIKTOK",
  "SNAPCHAT",
  "LINKEDIN",
  "X",
  "OTHER",
] as const;

export const campaignSchema = z.object({
  projectId: z.string().min(1, "required"),
  name: z.string().trim().min(1, "required").max(200, "maxLength"),
  platform: z.enum(campaignPlatformValues),
  objective: z.string().trim().max(500, "maxLength").optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;

export const campaignMetricSchema = z.object({
  spend: z.coerce.number().min(0).default(0),
  impressions: z.coerce.number().int().min(0).default(0),
  reach: z.coerce.number().int().min(0).default(0),
  clicks: z.coerce.number().int().min(0).default(0),
  leads: z.coerce.number().int().min(0).default(0),
  conversions: z.coerce.number().int().min(0).default(0),
  revenue: z.coerce.number().min(0).default(0),
});

export type CampaignMetricFormValues = z.infer<typeof campaignMetricSchema>;
