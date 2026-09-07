import { getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export async function NotificationBell({
  notificationsHref = "/portal/notifications",
}: {
  /** "" prefix for internal, "/portal" for the client portal. */
  notificationsHref?: string;
}) {
  const user = await requireUser();
  const t = await getTranslations("nav.notificationBell");

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label={t("title")}>
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -end-1 h-4 min-w-4 justify-center px-1 text-[10px]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t("title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-1.5 py-3 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          notifications.map((notification) =>
            notification.link ? (
              <DropdownMenuItem
                key={notification.id}
                render={
                  <Link href={notification.link} className="flex flex-col items-start gap-0.5">
                    <span className="text-sm font-medium">{notification.title}</span>
                    {notification.message && (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </span>
                    )}
                  </Link>
                }
              />
            ) : (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">{notification.title}</span>
                {notification.message && (
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {notification.message}
                  </span>
                )}
              </DropdownMenuItem>
            ),
          )
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={notificationsHref}>{t("viewAll")}</Link>} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
