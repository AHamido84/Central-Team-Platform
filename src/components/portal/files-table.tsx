import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format-date";

type AssetRow = {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt: Date;
  deliverable?: { title: string } | null;
  project?: { id: string; name: string } | null;
};

export async function FilesTable({
  assets,
  locale,
  showProject,
}: {
  assets: AssetRow[];
  locale: string;
  showProject: boolean;
}) {
  const t = await getTranslations("files");

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fields.fileName")}</TableHead>
            {showProject && <TableHead>{t("fields.project")}</TableHead>}
            <TableHead>{t("fields.deliverable")}</TableHead>
            <TableHead>{t("fields.uploadedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">
                <a
                  href={asset.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:underline"
                >
                  <FileText className="size-4 text-muted-foreground" />
                  {asset.fileName}
                </a>
              </TableCell>
              {showProject && (
                <TableCell className="text-muted-foreground">
                  {asset.project && (
                    <Link href={`/portal/projects/${asset.project.id}`} className="hover:underline">
                      {asset.project.name}
                    </Link>
                  )}
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">
                {asset.deliverable?.title ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(asset.createdAt, locale)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
