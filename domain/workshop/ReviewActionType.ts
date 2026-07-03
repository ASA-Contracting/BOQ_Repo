export const REVIEW_ACTION_TYPES = [
  "accept_ai",
  "override_ai",
  "manual_classify",
  "skip",
] as const;

export type ReviewActionType = (typeof REVIEW_ACTION_TYPES)[number];

export function isReviewActionType(value: string): value is ReviewActionType {
  return (REVIEW_ACTION_TYPES as readonly string[]).includes(value);
}
