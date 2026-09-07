import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

/** Internal-side counterpart to getProjectForClientOrNotFound in
 * portal-project.ts — no client-scope check, staff can see every project. */
export const getInternalProjectById = cache(async (projectId: string) => {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectType: true,
      client: { select: { id: true, companyName: true } },
    },
  });
});

export async function getInternalProjectOrNotFound(projectId: string) {
  const project = await getInternalProjectById(projectId);
  if (!project) notFound();
  return project;
}
