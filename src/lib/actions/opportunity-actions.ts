"use server";

import { revalidatePath } from "next/cache";
import { opportunitySchema } from "@/lib/validations/opportunity";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";
import type { OpportunityStage } from "@prisma/client";

export type OpportunityFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

export async function createOpportunityAction(
  _prevState: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "opportunities.manage");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = opportunitySchema.safeParse({
    clientId: formData.get("clientId"),
    projectId: formData.get("projectId") || undefined,
    leadId: formData.get("leadId") || undefined,
    title: formData.get("title"),
    value: formData.get("value") || undefined,
    probability: formData.get("probability") || undefined,
    expectedCloseDate: formData.get("expectedCloseDate"),
    ownerId: formData.get("ownerId") || undefined,
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  const opportunity = await prisma.opportunity.create({
    data: {
      clientId: data.clientId,
      projectId: data.projectId || null,
      leadId: data.leadId || null,
      title: data.title,
      value: data.value,
      probability: data.probability,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      ownerId: data.ownerId || null,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "OPPORTUNITY_CREATED",
    entityType: "Opportunity",
    entityId: opportunity.id,
    projectId: data.projectId || undefined,
  });

  revalidatePath("/sales");
}

const stageStatus: Record<OpportunityStage, "OPEN" | "WON" | "LOST"> = {
  NEW: "OPEN",
  QUALIFYING: "OPEN",
  PROPOSAL: "OPEN",
  NEGOTIATION: "OPEN",
  WON: "WON",
  LOST: "LOST",
};

/** Bound to the Sales Kanban's onMove — see updateTaskStatusAction for why
 * this throws instead of returning a form state. */
export async function updateOpportunityStageAction(
  opportunityId: string,
  stage: OpportunityStage,
): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "opportunities.manage");

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { stage, status: stageStatus[stage] },
  });

  await recordAudit({
    actorId: user.id,
    action: "OPPORTUNITY_STAGE_UPDATED",
    entityType: "Opportunity",
    entityId: opportunityId,
    metadata: { stage },
  });

  revalidatePath("/sales");
}
