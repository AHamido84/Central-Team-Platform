import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestForm } from "@/components/portal/request-form";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const user = await requireUser();
  const { projectId } = await searchParams;
  const t = await getTranslations("requests");

  const clientId = user.clientId;
  const [projects, requestTypes] = await Promise.all([
    clientId
      ? prisma.project.findMany({
          where: { clientId },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [],
    prisma.requestType.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("createTitle")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="sr-only">{t("createTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestForm
            projects={projects.map((p) => ({ id: p.id, label: p.name }))}
            requestTypes={requestTypes.map((rt) => ({ id: rt.id, label: rt.name }))}
            defaultProjectId={projectId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
