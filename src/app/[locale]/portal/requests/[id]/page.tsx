import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser, assertClientScope, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { formatDate } from "@/lib/format-date";
import { Link } from "@/i18n/navigation";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const t = await getTranslations("requests");
  const locale = await getLocale();

  const request = await prisma.request.findUnique({
    where: { id },
    include: { requestType: true, project: { select: { id: true, name: true } } },
  });

  if (!request) notFound();

  try {
    assertClientScope(user, request.clientId);
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        items={[
          { label: t("title"), href: "/portal/requests" },
          { label: `#${request.requestNumber}` },
        ]}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{request.title}</h1>
          <p className="text-sm text-muted-foreground">
            {request.requestType.name}
            {request.project && (
              <>
                {" · "}
                <Link href={`/portal/projects/${request.project.id}`} className="hover:underline">
                  {request.project.name}
                </Link>
              </>
            )}
          </p>
        </div>
        <Badge variant="secondary">{t(`status.${request.status}`)}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("fields.description")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="whitespace-pre-wrap text-foreground">
            {request.description || "—"}
          </p>
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3">
            <InfoRow label={t("fields.requestNumber")} value={`#${request.requestNumber}`} />
            <InfoRow label={t("fields.dueDate")} value={formatDate(request.dueDate, locale)} />
            <InfoRow label={t("fields.updatedAt")} value={formatDate(request.updatedAt, locale)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
