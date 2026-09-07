import type { z } from "zod";

export function zodFieldErrors(
  result: z.ZodSafeParseError<unknown> | { success: false; error: z.ZodError },
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
