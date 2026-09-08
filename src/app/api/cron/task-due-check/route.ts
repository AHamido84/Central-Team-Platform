import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import type { TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const OPEN_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "INTERNAL_REVIEW",
  "CLIENT_REVIEW",
  "CHANGES_REQUIRED",
];

/**
 * Daily check for "Task Due Soon" / "Task Overdue" notifications (spec §20)
 * — there's no persistent job runner in this app, so this is invoked by a
 * Vercel Cron entry (see vercel.json) instead of an in-process scheduler.
 * Guarded by CRON_SECRET so it can't be triggered by an arbitrary request.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [dueSoonTasks, overdueTasks] = await Promise.all([
    prisma.task.findMany({
      where: { status: { in: OPEN_STATUSES }, assigneeId: { not: null }, dueDate: { gte: now, lte: in24h } },
      select: { id: true, title: true, assigneeId: true },
    }),
    prisma.task.findMany({
      where: { status: { in: OPEN_STATUSES }, assigneeId: { not: null }, dueDate: { lt: now } },
      select: { id: true, title: true, assigneeId: true },
    }),
  ]);

  let notified = 0;
  for (const [tasks, type] of [
    [dueSoonTasks, "TASK_DUE_SOON"],
    [overdueTasks, "TASK_OVERDUE"],
  ] as const) {
    for (const task of tasks) {
      if (!task.assigneeId) continue;
      const link = `/tasks/${task.id}`;
      const alreadySentToday = await prisma.notification.findFirst({
        where: { userId: task.assigneeId, type, link, createdAt: { gte: startOfToday } },
        select: { id: true },
      });
      if (alreadySentToday) continue;
      await notifyUser(task.assigneeId, { type, title: task.title, link });
      notified += 1;
    }
  }

  return NextResponse.json({ checked: dueSoonTasks.length + overdueTasks.length, notified });
}
