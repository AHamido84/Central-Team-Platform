"use server";

import { revalidatePath } from "next/cache";
import { campaignSchema, campaignMetricSchema } from "@/lib/validations/campaign";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";

export type CampaignFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

export async function createCampaignAction(
  _prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "campaigns.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = campaignSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    platform: formData.get("platform"),
    objective: formData.get("objective"),
    budget: formData.get("budget") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  const campaign = await prisma.campaign.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      platform: data.platform,
      objective: data.objective || null,
      budget: data.budget,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "CAMPAIGN_CREATED",
    entityType: "Campaign",
    entityId: campaign.id,
    projectId: data.projectId,
  });

  revalidatePath("/campaigns");
  revalidatePath(`/projects/${data.projectId}/campaigns`);
}

export async function updateCampaignMetricAction(
  campaignId: string,
  projectId: string,
  _prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "campaigns.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = campaignMetricSchema.safeParse({
    spend: formData.get("spend") || 0,
    impressions: formData.get("impressions") || 0,
    reach: formData.get("reach") || 0,
    clicks: formData.get("clicks") || 0,
    leads: formData.get("leads") || 0,
    conversions: formData.get("conversions") || 0,
    revenue: formData.get("revenue") || 0,
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  await prisma.campaignMetric.upsert({
    where: { campaignId },
    update: data,
    create: { campaignId, ...data },
  });

  await recordAudit({
    actorId: user.id,
    action: "CAMPAIGN_METRICS_UPDATED",
    entityType: "Campaign",
    entityId: campaignId,
    projectId,
  });

  revalidatePath("/campaigns");
  revalidatePath(`/projects/${projectId}/campaigns`);
}
