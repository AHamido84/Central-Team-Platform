// Fixed catalog of audit-log actions that are meaningful as portal activity
// entries. Keeping this closed (rather than free-text) means activity.json
// can have a translation for every value that will ever be rendered.
export const ACTIVITY_ACTIONS = [
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "SCOPE_ITEM_CREATED",
  "REQUEST_CREATED",
  "TASK_CREATED",
  "TASK_STARTED",
  "TASK_COMPLETED",
  "DELIVERABLE_UPLOADED",
  "DELIVERABLE_VERSION_UPLOADED",
  "DELIVERABLE_SENT_FOR_REVIEW",
  "DELIVERABLE_APPROVED",
  "DELIVERABLE_CHANGES_REQUESTED",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];
