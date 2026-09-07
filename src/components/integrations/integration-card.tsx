import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  connectIntegrationAction,
  disconnectIntegrationAction,
} from "@/lib/actions/integration-actions";
import type { IntegrationProvider, IntegrationStatus } from "@prisma/client";

type IntegrationRow = {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  client?: { companyName: string } | null;
};

export async function IntegrationCard({ integration }: { integration: IntegrationRow }) {
  const t = await getTranslations("integrations");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t(`provider.${integration.provider}`)}</CardTitle>
        <Badge
          variant={
            integration.status === "CONNECTED"
              ? "default"
              : integration.status === "ERROR"
                ? "destructive"
                : "secondary"
          }
        >
          {t(`status.${integration.status}`)}
        </Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{integration.client?.companyName ?? "—"}</p>
        {integration.status === "CONNECTED" ? (
          <form action={disconnectIntegrationAction.bind(null, integration.id)}>
            <Button type="submit" variant="outline" size="sm">
              {t("actions.disconnect")}
            </Button>
          </form>
        ) : (
          <form action={connectIntegrationAction.bind(null, integration.id)}>
            <Button type="submit" size="sm">
              {t("actions.connect")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
