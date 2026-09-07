import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export default async function PortalAccountPage() {
  const sessionUser = await requireUser();
  const t = await getTranslations("account");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      role: { select: { name: true } },
      client: {
        select: { companyName: true, industry: true, accountManager: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <InfoRow label={t("profile.name")} value={user.name} />
          <InfoRow label={t("profile.email")} value={user.email} />
          <InfoRow label={t("profile.role")} value={user.role.name} />
        </CardContent>
      </Card>

      {user.client && (
        <Card>
          <CardHeader>
            <CardTitle>{t("company.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <InfoRow label={t("company.companyName")} value={user.client.companyName} />
            <InfoRow label={t("company.industry")} value={user.client.industry ?? "—"} />
            <InfoRow
              label={t("company.accountManager")}
              value={user.client.accountManager?.name ?? "—"}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
