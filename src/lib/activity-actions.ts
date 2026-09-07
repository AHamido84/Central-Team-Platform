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
  "REQUEST_STATUS_UPDATED",
  "REQUEST_ASSIGNED",
  "CAMPAIGN_CREATED",
  "CAMPAIGN_METRICS_UPDATED",
  "LEAD_CREATED",
  "LEAD_STATUS_UPDATED",
  "OPPORTUNITY_CREATED",
  "OPPORTUNITY_STAGE_UPDATED",
  "COMMENT_CREATED",
  "TEAM_MEMBER_INVITED",
  "INTEGRATION_CONNECTED",
  "INTEGRATION_DISCONNECTED",
  "PROJECT_TYPE_CREATED",
  "REQUEST_TYPE_CREATED",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];
