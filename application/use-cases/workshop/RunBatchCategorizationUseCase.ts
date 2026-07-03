import { mapFamiliesToTree } from "@/application/mappers/family/familyTreeMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { ICategorizationService } from "@/application/ports/ICategorizationService";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import { toFamilyId } from "@/domain/family/ids";
import { WorkshopBatchNotFoundError } from "@/domain/workshop/errors/WorkshopErrors";
import { toWorkshopBatchId } from "@/domain/workshop/ids";
import type { IWorkshopBatchRepository } from "@/domain/workshop/repositories/IWorkshopBatchRepository";
import type { IWorkshopItemRepository } from "@/domain/workshop/repositories/IWorkshopItemRepository";
import { ensureAspNetUserFromContext } from "@/infrastructure/auth/ensureAspNetUser";

const AI_CHUNK_SIZE = 75;
const AI_CHUNK_MAX_RETRIES = 2;

export type RunBatchCategorizationInput = {
  batchId: number;
};

export type RunBatchCategorizationResult = {
  batchId: number;
  suggestionCount: number;
};

export type RunBatchCategorizationDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
  workshopItemRepository: IWorkshopItemRepository;
  familyRepository: IFamilyRepository;
  categorizationService: ICategorizationService;
  unitOfWork: IUnitOfWork;
};

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export class RunBatchCategorizationUseCase
  implements IUseCase<RunBatchCategorizationInput, RunBatchCategorizationResult, DomainError>
{
  constructor(private readonly deps: RunBatchCategorizationDependencies) {}

  async execute(
    ctx: RequestContext,
    input: RunBatchCategorizationInput,
  ): Promise<Result<RunBatchCategorizationResult, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const batchId = toWorkshopBatchId(input.batchId);
    const batch = await this.deps.workshopBatchRepository.findById(batchId);
    if (!batch) {
      return err(new WorkshopBatchNotFoundError(batchId));
    }

    await ensureAspNetUserFromContext({ userId: ctx.userId });

    const [items, families] = await Promise.all([
      this.deps.workshopItemRepository.listForAiRun(batchId),
      this.deps.familyRepository.findAllFlat(),
    ]);

    if (items.length === 0) {
      return ok({ batchId: input.batchId, suggestionCount: 0 });
    }

    const familyTree = mapFamiliesToTree(families);
    const itemChunks = chunkArray(items, AI_CHUNK_SIZE);

    await this.deps.workshopBatchRepository.updateStatus(batchId, "ai_running");

    const allSuggestions: Array<{
      workshopItemId: import("@/domain/workshop/ids").WorkshopItemId;
      familyId: number;
      confidence: number;
      rationale: string;
      alternativeFamilyIds: number[];
    }> = [];

    let modelName = "";
    let promptVersion = "";
    let overallConfidence: number | null = null;
    const rawResponses: string[] = [];

    for (const chunk of itemChunks) {
      let chunkResult: Awaited<
        ReturnType<ICategorizationService["categorizeBatch"]>
      > | null = null;

      for (let attempt = 0; attempt <= AI_CHUNK_MAX_RETRIES; attempt += 1) {
        const result = await this.deps.categorizationService.categorizeBatch({
          batchId,
          items: chunk.map((item) => ({
            id: item.id,
            description: item.originalDescription ?? "",
            unit: item.originalUnit,
            quantity: item.contextQuantity,
          })),
          familyTree,
          correlationId: ctx.correlationId,
        });

        if (result.ok) {
          chunkResult = result;
          break;
        }

        if (attempt === AI_CHUNK_MAX_RETRIES) {
          await this.deps.workshopBatchRepository.updateStatus(batchId, "imported");
          return result;
        }
      }

      if (!chunkResult?.ok) {
        await this.deps.workshopBatchRepository.updateStatus(batchId, "imported");
        return chunkResult ?? err(new WorkshopBatchNotFoundError(batchId));
      }

      modelName = chunkResult.value.modelName;
      promptVersion = chunkResult.value.promptVersion;
      overallConfidence = chunkResult.value.overallConfidence;
      rawResponses.push(chunkResult.value.rawResponseJson);
      allSuggestions.push(...chunkResult.value.suggestions);
    }

    const startedAt = new Date();

    await this.deps.unitOfWork.runInTransaction(async () => {
      const analysisId = await this.deps.workshopBatchRepository.createAiAnalysis({
        batchId,
        modelName,
        promptVersion,
        familyTreeSnapshotJson: JSON.stringify(familyTree),
        itemCount: items.length,
        uncategorizedItemCount: items.filter((item) => !item.originalFamilyId).length,
        overallConfidence,
        rawResponseJson: JSON.stringify(rawResponses),
        triggeredBy: ctx.userId,
        startedAt,
        completedAt: new Date(),
      });

      for (const suggestion of allSuggestions) {
        const suggestionId = await this.deps.workshopItemRepository.persistAiSuggestion({
          workshopItemId: suggestion.workshopItemId,
          aiAnalysisId: analysisId,
          runNumber: 1,
          suggestedFamilyId: toFamilyId(suggestion.familyId),
          confidence: suggestion.confidence,
          rationale: suggestion.rationale,
          alternativeFamilyIds: suggestion.alternativeFamilyIds,
          modelName,
          promptVersion,
          createdBy: ctx.userId,
        });

        await this.deps.workshopItemRepository.updateItemAfterAiSuggestion(
          suggestion.workshopItemId,
          {
            latestSuggestedFamilyId: toFamilyId(suggestion.familyId),
            latestAiConfidence: suggestion.confidence,
            latestAiSuggestionId: suggestionId,
            aiProcessedAt: new Date(),
          },
        );
      }

      await this.deps.workshopBatchRepository.updateAfterAiRun(batchId, {
        latestAiAnalysisId: analysisId,
        status: "ready_for_review",
      });
    });

    return ok({
      batchId: input.batchId,
      suggestionCount: allSuggestions.length,
    });
  }
}
