import { getTranslations, getLocale } from "next-intl/server";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { Button } from "@/components/ui/button";
import { markNotificationReadAction } from "@/lib/actions/notification-actions";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";

export default async function InternalNotificationsPage() {
  const user = await requireUser();
  const t = await getTranslations("notifications");
  const locale = await getLocale();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-start justify-between gap-4 p-4",
                !notification.isRead && "bg-primary/5",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    notification.isRead ? "bg-transparent" : "bg-primary",
                  )}
                />
                <div>
                  <p className="text-sm font-medium">{notification.title}</p>
                  {notification.message && (
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(notification.createdAt, locale)}
                  </p>
                </div>
              </div>
              {!notification.isRead && (
                <form action={markNotificationReadAction.bind(null, notification.id)}>
                  <Button type="submit" variant="ghost" size="sm">
                    {t("markAsRead")}
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
