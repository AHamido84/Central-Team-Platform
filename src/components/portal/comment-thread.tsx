import { getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createCommentAction } from "@/lib/actions/comment-actions";
import { CommentForm } from "./comment-form";
import type { CommentableType } from "@prisma/client";

type CommentRow = {
  id: string;
  body: string;
  createdAtLabel: string;
  author: { name: string };
};

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function CommentThread({
  comments,
  entityType,
  entityId,
  revalidatePaths,
}: {
  comments: CommentRow[];
  entityType: CommentableType;
  entityId: string;
  revalidatePaths: string[];
}) {
  const t = await getTranslations("activity.comments");
  const action = createCommentAction.bind(null, revalidatePaths);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initialsFor(comment.author.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{comment.author.name}</span>
                  <span className="text-xs text-muted-foreground">{comment.createdAtLabel}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <CommentForm action={action} entityType={entityType} entityId={entityId} />
    </div>
  );
}
