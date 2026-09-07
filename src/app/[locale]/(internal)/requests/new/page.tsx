import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InternalRequestForm } from "@/components/requests/internal-request-form";
import { prisma } from "@/lib/prisma";

export default async function NewInternalRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; projectId?: string }>;
}) {
  const { clientId, projectId } = await searchParams;
  const t = await getTranslations("requests");

  const [clients, projects, requestTypes] = await Promise.all([
    prisma.client.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, clientId: true } }),
    prisma.requestType.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("createTitle")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="sr-only">{t("createTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <InternalRequestForm
            clients={clients.map((c) => ({ id: c.id, label: c.companyName }))}
            projects={projects.map((p) => ({ id: p.id, label: p.name, clientId: p.clientId }))}
            requestTypes={requestTypes.map((rt) => ({ id: rt.id, label: rt.name }))}
            defaultClientId={clientId}
            defaultProjectId={projectId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
