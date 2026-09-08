import type { RequestStatus } from "@prisma/client";

/** "Open" = still needs action from the agency or client; COMPLETED/ARCHIVED
 * are terminal. */
export const OPEN_REQUEST_STATUSES: RequestStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "INTERNAL_REVIEW",
  "CLIENT_REVIEW",
  "CHANGES_REQUIRED",
];
