"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickCreateMenu() {
  const t = useTranslations("nav.quickCreate");

  const items: { key: string; href: string }[] = [
    { key: "client", href: "/clients/new" },
    { key: "project", href: "/projects/new" },
    { key: "request", href: "/requests/new" },
    { key: "task", href: "/tasks" },
    { key: "deliverable", href: "/deliverables" },
    { key: "campaign", href: "/campaigns" },
    { key: "lead", href: "/leads" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("label")}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.key} render={<Link href={item.href}>{t(item.key)}</Link>} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
