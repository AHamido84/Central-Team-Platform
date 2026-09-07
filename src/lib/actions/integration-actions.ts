"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

/** Real DB-backed connect/disconnect toggle — no provider credentials exist
 * yet, so this is honestly "the connection state is tracked", not a live
 * OAuth handshake. See the Phase 1.5 plan's scope notes. */
export async function connectIntegrationAction(integrationId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "integrations.manage");

  await prisma.integration.update({
    where: { id: integrationId },
    data: { status: "CONNECTED", connectedById: user.id },
  });

  await recordAudit({
    actorId: user.id,
    action: "INTEGRATION_CONNECTED",
    entityType: "Integration",
    entityId: integrationId,
  });

  revalidatePath("/integrations");
}

export async function disconnectIntegrationAction(integrationId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "integrations.manage");

  await prisma.integration.update({
    where: { id: integrationId },
    data: { status: "DISCONNECTED", connectedById: null },
  });

  await recordAudit({
    actorId: user.id,
    action: "INTEGRATION_DISCONNECTED",
    entityType: "Integration",
    entityId: integrationId,
  });

  revalidatePath("/integrations");
}
