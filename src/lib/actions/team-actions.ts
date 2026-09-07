"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { teamInviteSchema } from "@/lib/validations/team";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";

export type TeamInviteState = {
  errors?: Record<string, string>;
  formError?: string;
  temporaryPassword?: string;
  invitedEmail?: string;
} | undefined;

function generateTemporaryPassword(): string {
  // Readable-enough temporary password: e.g. "Xk4-Pq9-Rw2" — no email service
  // exists to send it, so it's shown once in the UI for the inviter to relay.
  return crypto.randomBytes(6).toString("hex").toUpperCase().match(/.{1,4}/g)!.join("-");
}

export async function inviteTeamMemberAction(
  _prevState: TeamInviteState,
  formData: FormData,
): Promise<TeamInviteState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "team.invite");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = teamInviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    roleId: formData.get("roleId"),
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { errors: { email: "emailTaken" } };
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const invited = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      roleId: data.roleId,
      status: "INVITED",
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "TEAM_MEMBER_INVITED",
    entityType: "User",
    entityId: invited.id,
  });

  revalidatePath("/team");

  return { temporaryPassword, invitedEmail: data.email };
}
