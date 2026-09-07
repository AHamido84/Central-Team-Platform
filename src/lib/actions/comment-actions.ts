"use server";

import { revalidatePath } from "next/cache";
import { commentSchema } from "@/lib/validations/comment";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";

export type CommentFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

export async function createCommentAction(
  revalidatePaths: string[],
  _prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "comments.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = commentSchema.safeParse({
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
    body: formData.get("body"),
  });
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  const comment = await prisma.comment.create({
    data: {
      entityType: data.entityType,
      entityId: data.entityId,
      authorId: user.id,
      body: data.body,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "COMMENT_CREATED",
    entityType: data.entityType,
    entityId: comment.id,
  });

  for (const path of revalidatePaths) revalidatePath(path);
}
