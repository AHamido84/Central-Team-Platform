import "server-only";
import { prisma } from "./prisma";

type NotifyPayload = {
  type: string;
  title: string;
  message?: string;
  link?: string;
};

/** The only place that writes to the Notification model — every event that
 * should page a user goes through here, called inline next to `recordAudit`
 * at the mutation site (this codebase has no generic event bus). */
export async function notifyUser(userId: string, payload: NotifyPayload): Promise<void> {
  await prisma.notification.create({ data: { userId, ...payload } });
}

export async function notifyUsers(userIds: (string | null | undefined)[], payload: NotifyPayload): Promise<void> {
  const unique = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({ userId, ...payload })),
  });
}
