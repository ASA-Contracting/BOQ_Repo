export const WORKSHOP_BATCH_STATUSES = [
  "imported",
  "ai_running",
  "ready_for_review",
  "in_review",
  "completed",
] as const;

export type WorkshopBatchStatus = (typeof WORKSHOP_BATCH_STATUSES)[number];

export function isWorkshopBatchStatus(value: string): value is WorkshopBatchStatus {
  return (WORKSHOP_BATCH_STATUSES as readonly string[]).includes(value);
}
