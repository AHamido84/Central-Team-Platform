// Pure client-scoping logic with no server-only / Prisma / Auth.js imports,
// so it can be unit tested without a database or request context. The
// server-only guards that call into these (requireUser, requirePermission)
// live in ./authorization.ts.

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type AuthenticatedUser = {
  id: string;
  roleId: string;
  roleName: string;
  clientId: string | null;
};

export function isInternalUser(user: AuthenticatedUser): boolean {
  return user.clientId === null;
}

export function isClientUser(user: AuthenticatedUser): boolean {
  return user.clientId !== null;
}

/**
 * Client-portal users may only ever touch data belonging to their own
 * Client. Internal staff bypass this check (their access is governed by
 * requirePermission instead). The clientId being checked must come from a
 * record already loaded from the database — never trust an ID passed in
 * from the request.
 */
export function assertClientScope(user: AuthenticatedUser, clientId: string): void {
  if (isInternalUser(user)) return;
  if (user.clientId !== clientId) {
    throw new ForbiddenError("You do not have access to this client's data");
  }
}
