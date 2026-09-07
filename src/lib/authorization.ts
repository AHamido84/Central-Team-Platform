import "server-only";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import {
  ForbiddenError,
  isInternalUser,
  isClientUser,
  assertClientScope,
  type AuthenticatedUser,
} from "./authorization-core";

export { ForbiddenError, isInternalUser, isClientUser, assertClientScope };
export type { AuthenticatedUser };

/**
 * Every server action / route handler that touches Client-scoped data must
 * start here. The user identity always comes from the session, never from a
 * client-supplied field — see ARCHITECTURE.md §5.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth();
  const user = session?.user;
  if (!user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    // redirect() always throws (its type is `never`, but TS can't prove that
    // through next-intl's generic navigation types) — this throw makes the
    // unreachability explicit for the type checker.
    throw new Error("Unreachable: redirect() should have thrown");
  }
  return user;
}

/**
 * Throws unless the given permission key is granted to the user's role.
 */
export async function requirePermission(
  user: AuthenticatedUser,
  permissionKey: string,
): Promise<void> {
  const grant = await prisma.rolePermission.findFirst({
    where: {
      roleId: user.roleId,
      permission: { key: permissionKey },
    },
    select: { roleId: true },
  });
  if (!grant) {
    throw new ForbiddenError(`Missing permission: ${permissionKey}`);
  }
}
