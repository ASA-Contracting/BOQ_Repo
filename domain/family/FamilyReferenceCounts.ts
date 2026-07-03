export type FamilyReferenceCounts = {
  childCount: number;
  boqItemCount: number;
  workshopItemOriginalCount: number;
  workshopItemLatestSuggestedCount: number;
  workshopItemFinalCount: number;
  workshopItemProductionCheckCount: number;
  workshopAiSuggestionCount: number;
  workshopReviewPreviousCount: number;
  workshopReviewSelectedCount: number;
  workshopExportOldCount: number;
  workshopExportNewCount: number;
};

export function totalFamilyReferences(counts: FamilyReferenceCounts): number {
  return (
    counts.childCount +
    counts.boqItemCount +
    counts.workshopItemOriginalCount +
    counts.workshopItemLatestSuggestedCount +
    counts.workshopItemFinalCount +
    counts.workshopItemProductionCheckCount +
    counts.workshopAiSuggestionCount +
    counts.workshopReviewPreviousCount +
    counts.workshopReviewSelectedCount +
    counts.workshopExportOldCount +
    counts.workshopExportNewCount
  );
}

export function hasFamilyReferences(counts: FamilyReferenceCounts): boolean {
  return totalFamilyReferences(counts) > 0;
}

export function hasNonChildFamilyReferences(
  counts: FamilyReferenceCounts,
): boolean {
  return (
    counts.boqItemCount +
      counts.workshopItemOriginalCount +
      counts.workshopItemLatestSuggestedCount +
      counts.workshopItemFinalCount +
      counts.workshopItemProductionCheckCount +
      counts.workshopAiSuggestionCount +
      counts.workshopReviewPreviousCount +
      counts.workshopReviewSelectedCount +
      counts.workshopExportOldCount +
      counts.workshopExportNewCount >
    0
  );
}
