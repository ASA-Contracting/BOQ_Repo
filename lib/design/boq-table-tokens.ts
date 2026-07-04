/**
 * BOQ dense data-table design tokens.
 * Visual values: styles/boq-data-table.css
 */

export type BoqStatusTone = "neutral" | "published" | "progress" | "pending" | "draft";

export const boqTableTokens = {
  /** Structure — max 3 grays */
  bg: "var(--boq-dt-bg)",
  border: "var(--boq-dt-border)",
  textSecondary: "var(--boq-dt-text-secondary)",
  textPrimary: "var(--boq-dt-text-primary)",
  /** Primary actions only (Import Excel, etc.) */
  accent: "var(--boq-dt-accent)",
} as const;

export function publishStatusTone(status: "complete" | "in_progress" | "empty"): BoqStatusTone {
  switch (status) {
    case "complete":
      return "published";
    case "in_progress":
      return "progress";
    default:
      return "neutral";
  }
}

export function approvalStatusTone(status: string | null): BoqStatusTone {
  switch (status) {
    case "approved":
      return "published";
    case "pending_engineer":
    case "pending_section_head":
      return "pending";
    case "draft":
      return "draft";
    case "returned":
      return "progress";
    default:
      return "neutral";
  }
}

/** Progress bar fill matches publish status tone. */
export function progressFillClass(tone: BoqStatusTone): string {
  return `boq-progress-fill boq-progress-fill--${tone}`;
}

export function pillClass(tone: BoqStatusTone): string {
  return `boq-pill boq-pill--${tone}`;
}
