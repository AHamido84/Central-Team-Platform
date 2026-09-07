import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { DeliverableActions } from "./deliverable-actions";
import {
  approveDeliverableAction,
  requestDeliverableChangesAction,
} from "@/lib/actions/deliverable-actions";

type DeliverableCardData = {
  id: string;
  title: string;
  category: string | null;
  status: string;
  version: number;
  project?: { id: string; name: string } | null;
  assets: { id: string; fileName: string; fileUrl: string; fileType: string | null }[];
};

export async function DeliverableCard({
  deliverable,
  showProject,
  basePath = "/portal",
}: {
  deliverable: DeliverableCardData;
  showProject: boolean;
  /** "" for internal, "/portal" for the client portal. */
  basePath?: string;
}) {
  const t = await getTranslations("deliverables");
  const tCategory = await getTranslations("projects.scope.category");
  const asset = deliverable.assets[0];
  const isImage = asset?.fileType?.startsWith("image/");

  return (
    <Card className="overflow-hidden">
      <div className="flex aspect-video items-center justify-center bg-muted">
        {isImage && asset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.fileUrl} alt={deliverable.title} className="size-full object-contain p-8" />
        ) : (
          <FileText className="size-10 text-muted-foreground" />
        )}
      </div>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="min-w-0">
          <h3 className="truncate font-medium">{deliverable.title}</h3>
          <p className="text-xs text-muted-foreground">
            {deliverable.category && tCategory(deliverable.category)}
            {deliverable.category && " · "}
            {t("fields.version")} {deliverable.version}
            {showProject && deliverable.project && (
              <>
                {" · "}
                <Link href={`${basePath}/projects/${deliverable.project.id}`} className="hover:underline">
                  {deliverable.project.name}
                </Link>
              </>
            )}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {t(`status.${deliverable.status}`)}
        </Badge>
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
  );
}
