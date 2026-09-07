import type { RequestStatus } from "@prisma/client";

/** "Open" = still needs action from the agency; CONVERTED/REJECTED are terminal. */
export const OPEN_REQUEST_STATUSES: RequestStatus[] = ["NEW", "REVIEWING", "APPROVED"];
