import { describe, expect, it } from "vitest";

import { DeleteFamilyUseCase } from "@/application/use-cases/family/DeleteFamilyUseCase";
import {
  FamilyHasChildrenError,
  FamilyNotFoundError,
  FamilyReferencedError,
} from "@/domain/family/errors/FamilyErrors";
import {
  adminContext,
  childFamily,
  createFamilyRepositoryMock,
  createMemoryUnitOfWork,
  viewerContext,
} from "@/application/use-cases/family/testHelpers";

describe("DeleteFamilyUseCase", () => {
  it("deletes a family for system administrators when safe", async () => {
    let deleted = false;

    const useCase = new DeleteFamilyUseCase({
      familyRepository: createFamilyRepositoryMock({
        findById: async () => childFamily,
        delete: async () => {
          deleted = true;
        },
      }),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      familyId: childFamily.id as number,
    });

    expect(result.ok).toBe(true);
    expect(deleted).toBe(true);
  });

  it("denies non-administrators", async () => {
    const useCase = new DeleteFamilyUseCase({
      familyRepository: createFamilyRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(viewerContext, {
      familyId: childFamily.id as number,
    });

    expect(result.ok).toBe(false);
  });

  it("returns not found when the family does not exist", async () => {
    const useCase = new DeleteFamilyUseCase({
      familyRepository: createFamilyRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, { familyId: 404 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FamilyNotFoundError);
    }
  });

  it("blocks delete when child families exist", async () => {
    const useCase = new DeleteFamilyUseCase({
      familyRepository: createFamilyRepositoryMock({
        findById: async () => childFamily,
        getReferenceCounts: async () => ({
          childCount: 1,
          boqItemCount: 0,
          workshopItemOriginalCount: 0,
          workshopItemLatestSuggestedCount: 0,
          workshopItemFinalCount: 0,
          workshopItemProductionCheckCount: 0,
          workshopAiSuggestionCount: 0,
          workshopReviewPreviousCount: 0,
          workshopReviewSelectedCount: 0,
          workshopExportOldCount: 0,
          workshopExportNewCount: 0,
        }),
      }),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      familyId: childFamily.id as number,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FamilyHasChildrenError);
    }
  });

  it("blocks delete when references exist", async () => {
    const useCase = new DeleteFamilyUseCase({
      familyRepository: createFamilyRepositoryMock({
        findById: async () => childFamily,
        getReferenceCounts: async () => ({
          childCount: 0,
          boqItemCount: 2,
          workshopItemOriginalCount: 0,
          workshopItemLatestSuggestedCount: 0,
          workshopItemFinalCount: 0,
          workshopItemProductionCheckCount: 0,
          workshopAiSuggestionCount: 0,
          workshopReviewPreviousCount: 0,
          workshopReviewSelectedCount: 0,
          workshopExportOldCount: 0,
          workshopExportNewCount: 0,
        }),
      }),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      familyId: childFamily.id as number,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FamilyReferencedError);
    }
  });
});
