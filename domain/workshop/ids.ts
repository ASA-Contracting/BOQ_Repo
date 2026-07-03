export type WorkshopBatchId = number & { readonly __brand: "WorkshopBatchId" };
export type WorkshopItemId = number & { readonly __brand: "WorkshopItemId" };
export type WorkshopAiAnalysisId = number & { readonly __brand: "WorkshopAiAnalysisId" };
export type WorkshopAiSuggestionId = number & { readonly __brand: "WorkshopAiSuggestionId" };

export function toWorkshopBatchId(value: number): WorkshopBatchId {
  return value as WorkshopBatchId;
}

export function toWorkshopItemId(value: number): WorkshopItemId {
  return value as WorkshopItemId;
}

export function toWorkshopAiAnalysisId(value: number): WorkshopAiAnalysisId {
  return value as WorkshopAiAnalysisId;
}

export function toWorkshopAiSuggestionId(value: number): WorkshopAiSuggestionId {
  return value as WorkshopAiSuggestionId;
}
