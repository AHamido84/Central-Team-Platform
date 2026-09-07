"use server";

import { revalidatePath } from "next/cache";
import { leadSchema } from "@/lib/validations/lead";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { zodFieldErrors } from "@/lib/form-utils";
import type { LeadStatus } from "@prisma/client";

export type LeadFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

export async function createLeadAction(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "leads.manage");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = leadSchema.safeParse({
    clientId: formData.get("clientId"),
    projectId: formData.get("projectId") || undefined,
    campaignId: formData.get("campaignId") || undefined,
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    source: formData.get("source"),
    assignedToId: formData.get("assignedToId") || undefined,
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  const lead = await prisma.lead.create({
    data: {
      clientId: data.clientId,
      projectId: data.projectId || null,
      campaignId: data.campaignId || null,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      source: data.source || null,
      assignedToId: data.assignedToId || null,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "LEAD_CREATED",
    entityType: "Lead",
    entityId: lead.id,
    projectId: data.projectId || undefined,
  });

  revalidatePath("/leads");
  const locale = await getLocale();
  redirect({ href: "/leads", locale });
}

export type LeadActionState = { formError?: string } | undefined;

export async function updateLeadStatusAction(
  leadId: string,
  status: LeadStatus,
): Promise<LeadActionState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "leads.manage");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  await prisma.lead.update({ where: { id: leadId }, data: { status } });

  await recordAudit({
    actorId: user.id,
    action: "LEAD_STATUS_UPDATED",
    entityType: "Lead",
    entityId: leadId,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}
