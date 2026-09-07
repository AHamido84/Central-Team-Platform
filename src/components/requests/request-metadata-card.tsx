import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUEST_FIELD_KEYS, type RequestFieldSet } from "@/lib/request-type-fields";

/** Shows the request-type-specific details (dimensions, duration, budget,
 * ...) collected on creation — renders nothing for a generic request or one
 * with no metadata filled in. */
export async function RequestMetadataCard({
  fieldSet,
  metadata,
}: {
  fieldSet: RequestFieldSet | null;
  metadata: Record<string, string> | null;
}) {
  if (!fieldSet || !metadata) return null;
  const t = await getTranslations("requests.typeFields");

  const rows = REQUEST_FIELD_KEYS[fieldSet]
    .filter(({ key }) => metadata[key])
    .map(({ key }) => ({ label: t(`${fieldSet}.${key}`), value: metadata[key] }));

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5 border-b border-border pb-2 last:border-0 last:pb-0">
            <span className="text-xs text-muted-foreground">{row.label}</span>
            <span className="whitespace-pre-wrap font-medium">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
