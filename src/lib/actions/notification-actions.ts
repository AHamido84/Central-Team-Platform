"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const user = await requireUser();

  // updateMany + userId in the where clause means this silently no-ops for a
  // notification that isn't the caller's — never trust the id alone.
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });

  revalidatePath("/portal/notifications");
}
