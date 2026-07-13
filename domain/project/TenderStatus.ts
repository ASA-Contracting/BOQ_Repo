export const TENDER_STATUSES = [
  "Sent",
  "Lose",
  "cold case",
  "Postponed",
  "Under Study",
  "New",
  "Done To Review",
  "Closed Won",
] as const;

export type TenderStatus = (typeof TENDER_STATUSES)[number];

export function normalizeOwnerType(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "-") {
    return null;
  }
  return trimmed;
}
