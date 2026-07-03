import type { FamilyTreeNodeDto } from "@/application/dto/family/familyDto";
import type { CorrelationId } from "@/domain/shared/ids";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { Result } from "@/domain/shared/Result";
import type { WorkshopBatchId } from "@/domain/workshop/ids";
import type { WorkshopItemId } from "@/domain/workshop/ids";

export type CategorizationItemInput = {
  id: WorkshopItemId;
  description: string;
  unit: string | null;
  quantity: string | null;
};

export type CategorizationSuggestionResult = {
  workshopItemId: WorkshopItemId;
  familyId: number;
  confidence: number;
  rationale: string;
  alternativeFamilyIds: number[];
};

export type CategorizationBatchResult = {
  suggestions: CategorizationSuggestionResult[];
  modelName: string;
  promptVersion: string;
  rawResponseJson: string;
  overallConfidence: number | null;
};

export interface ICategorizationService {
  categorizeBatch(input: {
    batchId: WorkshopBatchId;
    items: CategorizationItemInput[];
    familyTree: FamilyTreeNodeDto[];
    correlationId: CorrelationId;
  }): Promise<Result<CategorizationBatchResult, DomainError>>;
}
