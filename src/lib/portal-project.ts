import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertClientScope, ForbiddenError, type AuthenticatedUser } from "@/lib/authorization";

/**
 * Memoized per-request so the layout and every tab page under
 * portal/projects/[id] can each call this without re-querying the DB —
 * React's `cache()` dedupes identical calls within one request.
 */
export const getProjectById = cache(async (projectId: string) => {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectType: true,
      client: { select: { companyName: true } },
    },
  });
});

/**
 * Every tab page under portal/projects/[id] calls this — it's the one place
 * that re-derives the client scope from the loaded project and checks it
 * against the session, rather than trusting the [id] in the URL. Cheap to
 * call repeatedly thanks to getProjectById's request-level memoization.
 */
export async function getProjectForClientOrNotFound(
  projectId: string,
  user: AuthenticatedUser,
) {
  const project = await getProjectById(projectId);
  if (!project) notFound();
  try {
    assertClientScope(user, project.clientId);
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }
  return project;
}
