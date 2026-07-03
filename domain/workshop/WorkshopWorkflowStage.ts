export const WORKSHOP_WORKFLOW_STAGES = [
  "imported",
  "ai_running",
  "ready_for_engineer_review",
  "awaiting_section_head",
  "version_approved",
  "completed",
] as const;

export type WorkshopWorkflowStage = (typeof WORKSHOP_WORKFLOW_STAGES)[number];

export function isWorkshopWorkflowStage(value: string): value is WorkshopWorkflowStage {
  return (WORKSHOP_WORKFLOW_STAGES as readonly string[]).includes(value);
}

export const BOQ_VERSION_APPROVAL_STATUSES = [
  "draft",
  "pending_section_head",
  "approved",
] as const;

export type BoqVersionApprovalStatus = (typeof BOQ_VERSION_APPROVAL_STATUSES)[number];

export function isBoqVersionApprovalStatus(value: string): value is BoqVersionApprovalStatus {
  return (BOQ_VERSION_APPROVAL_STATUSES as readonly string[]).includes(value);
}
