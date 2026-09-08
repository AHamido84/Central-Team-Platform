import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LayoutTemplate } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { EmptyState } from "@/components/portal/empty-state";
import { CreateTemplateDialog } from "@/components/settings/create-template-dialog";
import { TemplateCardActions } from "@/components/settings/template-card-actions";
import { pickLocalized } from "@/lib/dynamic-form-shared";
import { formatDate } from "@/lib/format-date";

export default async function RequestTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ requestTypeId?: string; status?: string }>;
}) {
  const { requestTypeId, status } = await searchParams;
  const t = await getTranslations("settings.requestTemplates");
  const tSettings = await getTranslations("settings");
  const locale = await getLocale();

  const [templates, requestTypes] = await Promise.all([
    prisma.requestTemplate.findMany({
      where: {
        requestTypeId: requestTypeId || undefined,
        isArchived: status === "archived" ? true : status === "active" ? false : undefined,
      },
      orderBy: [{ isArchived: "asc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
      include: {
        requestType: { select: { name: true } },
        currentVersion: {
          select: {
            nameAr: true,
            nameEn: true,
            version: true,
            _count: { select: { sections: true, tasks: true } },
            sections: { select: { _count: { select: { fields: true } } } },
          },
        },
        versions: {
          where: { isPublished: false },
          select: { nameAr: true, nameEn: true, createdAt: true },
          take: 1,
        },
      },
    }),
    prisma.requestType.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // RequestTemplate has no direct `requests` relation (a request points at
  // a *version*, for versioning integrity) — one query tallies usage across
  // every template's versions instead of counting per-template (N+1).
  const usageRows = await prisma.request.findMany({
    where: { templateVersion: { templateId: { in: templates.map((tpl) => tpl.id) } } },
    select: { templateVersion: { select: { templateId: true } } },
  });
  const usageByTemplate = new Map<string, number>();
  for (const row of usageRows) {
    const templateId = row.templateVersion?.templateId;
    if (!templateId) continue;
    usageByTemplate.set(templateId, (usageByTemplate.get(templateId) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: tSettings("title"), href: "/settings" }, { label: t("title") }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <CreateTemplateDialog requestTypes={requestTypes.map((rt) => ({ id: rt.id, label: rt.name }))} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={!requestTypeId ? "secondary" : "ghost"} render={<Link href="/settings/request-templates">{t("filters.allTypes")}</Link>} />
        {requestTypes.map((rt) => (
          <Button
            key={rt.id}
            size="sm"
            variant={requestTypeId === rt.id ? "secondary" : "ghost"}
            render={<Link href={`/settings/request-templates?requestTypeId=${rt.id}`}>{rt.name}</Link>}
          />
        ))}
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title={t("empty")} description={t("description")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const display = tpl.currentVersion ?? tpl.versions[0];
            const fieldCount = tpl.currentVersion?.sections.reduce((sum, s) => sum + s._count.fields, 0) ?? 0;
            return (
              <Card key={tpl.id} className={tpl.isArchived ? "opacity-60" : undefined}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate">
                      {tpl.icon ? `${tpl.icon} ` : ""}
                      {display ? pickLocalized(display.nameAr, display.nameEn, locale) : "—"}
                    </CardTitle>
                    <p className="truncate text-xs text-muted-foreground">{tpl.requestType.name}</p>
                  </div>
                  {tpl.isArchived ? (
                    <Badge variant="outline">{t("status.archived")}</Badge>
                  ) : tpl.currentVersionId ? (
                    <Badge variant="secondary">{t("status.published")}</Badge>
                  ) : (
                    <Badge variant="outline">{t("status.draft")}</Badge>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{t("card.sections", { count: tpl.currentVersion?._count.sections ?? 0 })}</span>
                    <span>{t("card.fields", { count: fieldCount })}</span>
                    <span>{t("card.tasks", { count: tpl.currentVersion?._count.tasks ?? 0 })}</span>
                    <span>{t("card.usage", { count: usageByTemplate.get(tpl.id) ?? 0 })}</span>
                  </div>
                  {tpl.currentVersion && (
                    <span className="text-xs text-muted-foreground">
                      {t("card.version", { version: tpl.currentVersion.version })}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t("card.updatedAt", { date: formatDate(tpl.updatedAt, locale) })}
                  </span>
                  <TemplateCardActions templateId={tpl.id} isArchived={tpl.isArchived} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
