import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { requireUser, assertClientScope, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Link } from "@/i18n/navigation";
import { DeliverableActions } from "@/components/portal/deliverable-actions";
import {
  approveDeliverableAction,
  requestDeliverableChangesAction,
} from "@/lib/actions/deliverable-actions";

export default async function DeliverableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const t = await getTranslations("deliverables");
  const tCategory = await getTranslations("projects.scope.category");

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    include: { assets: true, project: { select: { id: true, name: true, clientId: true } } },
  });

  if (!deliverable) notFound();

  try {
    assertClientScope(user, deliverable.project.clientId);
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }

  const asset = deliverable.assets[0];
  const isImage = asset?.fileType?.startsWith("image/");

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        items={[{ label: t("title"), href: "/portal/deliverables" }, { label: deliverable.title }]}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{deliverable.title}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/portal/projects/${deliverable.project.id}`} className="hover:underline">
              {deliverable.project.name}
            </Link>
          </p>
        </div>
        <Badge variant="secondary">{t(`status.${deliverable.status}`)}</Badge>
      </div>

      <Card className="overflow-hidden">
        <div className="flex aspect-video items-center justify-center bg-muted">
          {isImage && asset ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.fileUrl} alt={deliverable.title} className="size-full object-contain p-10" />
          ) : (
            <FileText className="size-14 text-muted-foreground" />
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {deliverable.category && tCategory(deliverable.category)} · {t("fields.version")}{" "}
            {deliverable.version}
          </CardTitle>
        </CardHeader>
        {deliverable.status === "IN_REVIEW" && (
          <CardContent>
            <DeliverableActions
              approveAction={approveDeliverableAction.bind(null, deliverable.id)}
              requestChangesAction={requestDeliverableChangesAction.bind(null, deliverable.id)}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
