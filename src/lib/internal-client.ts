import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Memoized per-request so the client workspace layout and every tab page
 * under clients/[id] can each call this without re-querying the DB. No
 * client-scope check is needed here — this tree is internal-only (guarded by
 * the (internal) layout), and staff can see every client.
 */
export const getClientById = cache(async (clientId: string) => {
  return prisma.client.findUnique({
    where: { id: clientId },
    include: { accountManager: { select: { name: true } } },
  });
});

export async function getClientOrNotFound(clientId: string) {
  const client = await getClientById(clientId);
  if (!client) notFound();
  return client;
}
