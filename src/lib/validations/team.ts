import { z } from "zod";

export const teamInviteSchema = z.object({
  name: z.string().trim().min(1, "required").max(200, "maxLength"),
  email: z.string().trim().email("invalidEmail"),
  roleId: z.string().min(1, "required"),
});

export type TeamInviteFormValues = z.infer<typeof teamInviteSchema>;
