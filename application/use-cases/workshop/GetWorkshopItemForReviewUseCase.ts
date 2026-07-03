import type { WorkshopItemReviewDto } from "@/application/dto/workshop/categorizationDto";
import {
  buildFamilyPathMap,
  resolveFamilyPath,
} from "@/application/mappers/workshop/familyPathMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import {
  WorkshopBatchNotFoundError,
  WorkshopItemNotFoundError,
} from "@/domain/workshop/errors/WorkshopErrors";
import { toWorkshopBatchId, toWorkshopItemId } from "@/domain/workshop/ids";
import type { IWorkshopBatchRepository } from "@/domain/workshop/repositories/IWorkshopBatchRepository";
import type {
  IWorkshopItemRepository,
  IWorkshopReviewRepository,
} from "@/domain/workshop/repositories/IWorkshopItemRepository";

export type GetWorkshopItemForReviewInput = {
  batchId: number;
  itemId: number;
};

export type GetWorkshopItemForReviewDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
  workshopItemRepository: IWorkshopItemRepository;
  workshopReviewRepository: IWorkshopReviewRepository;
  familyRepository: IFamilyRepository;
};

function parseSnapshot(json: string | null): {
  section: string | null;
  discipline: string | null;
} {
  if (!json) {
    return { section: null, discipline: null };
  }

  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return {
      section: typeof parsed.section === "string" ? parsed.section : null,
      discipline: typeof parsed.discipline === "string" ? parsed.discipline : null,
    };
  } catch {
    return { section: null, discipline: null };
  }
}

export class GetWorkshopItemForReviewUseCase
  implements IUseCase<GetWorkshopItemForReviewInput, WorkshopItemReviewDto, DomainError>
{
  constructor(private readonly deps: GetWorkshopItemForReviewDependencies) {}

  async execute(
    ctx: RequestContext,
    input: GetWorkshopItemForReviewInput,
  ): Promise<Result<WorkshopItemReviewDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batchId = toWorkshopBatchId(input.batchId);
    const itemId = toWorkshopItemId(input.itemId);

    const batch = await this.deps.workshopBatchRepository.findById(batchId);
    if (!batch) {
      return err(new WorkshopBatchNotFoundError(batchId));
    }

    const item = await this.deps.workshopItemRepository.findById(itemId, batchId);
    if (!item) {
      return err(new WorkshopItemNotFoundError(itemId));
    }

    const [families, suggestions, similarItems, priorDecisions] = await Promise.all([
      this.deps.familyRepository.findAllFlat(),
      this.deps.workshopItemRepository.getSuggestionsForItem(itemId),
      this.deps.workshopItemRepository.listSimilarItems(
        batchId,
        item.originalDescription ?? "",
        itemId,
        5,
      ),
      this.deps.workshopReviewRepository.listPriorDecisions(
        item.originalDescription ?? "",
        5,
      ),
    ]);

    const pathMap = buildFamilyPathMap(families);
    const snapshot = parseSnapshot(item.contextSnapshotJson);

    return ok({
      id: item.id as number,
      batchId: item.batchId as number,
      rowIndex: item.originalRowIndex,
      description: item.originalDescription,
      originalText: item.originalDescription,
      unit: item.originalUnit,
      quantity: item.contextQuantity,
      section: snapshot.section,
      discipline: snapshot.discipline,
      existingMappingPath: resolveFamilyPath(pathMap, item.originalFamilyId),
      finalFamilyId: item.finalFamilyId as number | null,
      finalFamilyPath: resolveFamilyPath(pathMap, item.finalFamilyId),
      reviewStatus: item.reviewStatus,
      aiSuggestions: suggestions.map((suggestion) => ({
        id: suggestion.id,
        familyId: suggestion.suggestedFamilyId as number | null,
        familyPath: resolveFamilyPath(pathMap, suggestion.suggestedFamilyId),
        confidence: suggestion.confidence ? Number(suggestion.confidence) : null,
        rationale: suggestion.rationale,
        alternativeFamilyIds: suggestion.alternativeFamilyIds,
        runNumber: suggestion.runNumber,
      })),
      similarItems: similarItems.map((similar) => ({
        id: similar.id as number,
        description: similar.description,
        finalFamilyId: similar.finalFamilyId as number | null,
        finalFamilyPath: resolveFamilyPath(pathMap, similar.finalFamilyId),
      })),
      priorDecisions: priorDecisions.map((decision) => ({
        id: decision.id,
        selectedFamilyId: decision.selectedFamilyId as number | null,
        selectedFamilyName: decision.selectedFamilyName,
        userDisplayName: decision.userDisplayName,
        createdAt: decision.createdAt.toISOString(),
        itemDescription: decision.itemDescription,
      })),
    });
  }
}
