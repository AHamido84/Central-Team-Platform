import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { ActivityAction } from "./activity-actions";

export async function recordAudit(params: {
  actorId: string | null;
  action: ActivityAction | (string & {});
  entityType: string;
  entityId: string;
  /** Set for entities that belong to a project, so the portal Activity tab
   * can query "everything for project X" without joining every entity type. */
  projectId?: string;
  /** Set for entities that belong to a client (or are the client itself), so
   * the Client 360 Activity tab can query "everything for client X". */
  clientId?: string;
  metadata?: Prisma.InputJsonObject;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      projectId: params.projectId,
      clientId: params.clientId,
      metadata: params.metadata,
    },
  });
}
