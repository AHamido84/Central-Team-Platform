import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { TemplateBuilder } from "@/components/settings/template-builder";

export default async function NewRequestTemplatePage() {
  const tSettings = await getTranslations("settings");
  const t = await getTranslations("settings.templates");

  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        items={[{ label: tSettings("title"), href: "/settings" }, { label: t("newButton") }]}
      />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("newButton")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <TemplateBuilder departments={departments.map((d) => ({ id: d.id, label: d.name }))} />
    </div>
  );
}
