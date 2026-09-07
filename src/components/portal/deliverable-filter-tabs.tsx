import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const FILTER_CATEGORIES = ["DESIGN", "VIDEO", "VOICE_OVER"] as const;

export async function DeliverableFilterTabs({
  basePath,
  active,
}: {
  basePath: string;
  active?: string;
}) {
  const t = await getTranslations("deliverables.filter");

  const items = [
    { value: undefined, label: t("all") },
    ...FILTER_CATEGORIES.map((value) => ({ value, label: t(value) })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = active === item.value;
        return (
          <Link
            key={item.value ?? "all"}
            href={item.value ? `${basePath}?category=${item.value}` : basePath}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
