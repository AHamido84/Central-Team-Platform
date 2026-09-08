import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/settings/profile-form";
import { AddProjectTypeDialog } from "@/components/settings/add-project-type-dialog";
import { AddRequestTypeDialog } from "@/components/settings/add-request-type-dialog";
import { AddDepartmentDialog } from "@/components/team/add-department-dialog";

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const t = await getTranslations("settings");
  const tTeam = await getTranslations("team.departments");
  const tCategory = await getTranslations("projects.scope.category");

  const [user, projectTypes, requestTypes, departments, templates] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id }, select: { name: true, locale: true } }),
    prisma.projectType.findMany({ orderBy: { name: "asc" } }),
    prisma.requestType.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.requestTemplate.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { items: true } } } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm name={user.name} locale={user.locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("projectTypes.title")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("projectTypes.description")}</p>
            </div>
            <AddProjectTypeDialog />
          </CardHeader>
          <CardContent>
            {projectTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("projectTypes.empty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {projectTypes.map((pt) => (
                  <li key={pt.id} className="py-2 text-sm">
                    <span className="font-medium">{pt.name}</span>
                    {pt.description && (
                      <span className="text-muted-foreground"> — {pt.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("requestTypes.title")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("requestTypes.description")}</p>
            </div>
            <AddRequestTypeDialog />
          </CardHeader>
          <CardContent>
            {requestTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("requestTypes.empty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {requestTypes.map((rt) => (
                  <li key={rt.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <span className="font-medium">{rt.name}</span>
                      {rt.description && (
                        <span className="text-muted-foreground"> — {rt.description}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {rt.category ? tCategory(rt.category) : t("requestTypes.noCategory")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{tTeam("title")}</CardTitle>
              <p className="text-xs text-muted-foreground">{tTeam("description")}</p>
            </div>
            <AddDepartmentDialog />
          </CardHeader>
          <CardContent>
            {departments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tTeam("empty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {departments.map((d) => (
                  <li key={d.id} className="py-2 text-sm font-medium">
                    {d.name}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("templates.title")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("templates.description")}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/settings/templates/new">{t("templates.newButton")}</Link>}
            />
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("templates.empty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {templates.map((tpl) => (
                  <li key={tpl.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium">{tpl.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {tpl._count.items} {t("templates.items.title")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
