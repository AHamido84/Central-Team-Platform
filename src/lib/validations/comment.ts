import { z } from "zod";

export const commentableTypeValues = [
  "PROJECT",
  "TASK",
  "REQUEST",
  "DELIVERABLE",
  "OPPORTUNITY",
] as const;

export const commentSchema = z.object({
  entityType: z.enum(commentableTypeValues),
  entityId: z.string().min(1, "required"),
  body: z.string().trim().min(1, "required").max(4000, "maxLength"),
});

export type CommentFormValues = z.infer<typeof commentSchema>;
