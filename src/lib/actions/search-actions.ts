"use server";

import { requireUser, isInternalUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export type GlobalSearchResult = {
  clients: { id: string; label: string }[];
  projects: { id: string; label: string; sublabel: string }[];
  requests: { id: string; label: string; sublabel: string }[];
  tasks: { id: string; label: string; sublabel: string }[];
  deliverables: { id: string; label: string; sublabel: string }[];
};

const EMPTY: GlobalSearchResult = {
  clients: [],
  projects: [],
  requests: [],
  tasks: [],
  deliverables: [],
};

/** Internal-side only — the portal is already scoped to one client via its
 * own nav, so cross-entity search matters most for staff working across
 * many clients at once. */
export async function globalSearchAction(query: string): Promise<GlobalSearchResult> {
  const user = await requireUser();
  if (!isInternalUser(user)) return EMPTY;

  const term = query.trim();
  if (term.length < 2) return EMPTY;

  const [clients, projects, requests, tasks, deliverables] = await Promise.all([
    prisma.client.findMany({
      where: { companyName: { contains: term, mode: "insensitive" } },
      take: 5,
      select: { id: true, companyName: true },
    }),
    prisma.project.findMany({
      where: { name: { contains: term, mode: "insensitive" } },
      take: 5,
      select: { id: true, name: true, client: { select: { companyName: true } } },
    }),
    prisma.request.findMany({
      where: { title: { contains: term, mode: "insensitive" } },
      take: 5,
      select: { id: true, title: true, client: { select: { companyName: true } } },
    }),
    prisma.task.findMany({
      where: { title: { contains: term, mode: "insensitive" } },
      take: 5,
      select: { id: true, title: true, project: { select: { name: true } } },
    }),
    prisma.deliverable.findMany({
      where: { title: { contains: term, mode: "insensitive" } },
      take: 5,
      select: { id: true, title: true, project: { select: { name: true } } },
    }),
  ]);

  return {
    clients: clients.map((c) => ({ id: c.id, label: c.companyName })),
    projects: projects.map((p) => ({ id: p.id, label: p.name, sublabel: p.client.companyName })),
    requests: requests.map((r) => ({ id: r.id, label: r.title, sublabel: r.client.companyName })),
    tasks: tasks.map((t) => ({ id: t.id, label: t.title, sublabel: t.project.name })),
    deliverables: deliverables.map((d) => ({
      id: d.id,
      label: d.title,
      sublabel: d.project.name,
    })),
  };
}
