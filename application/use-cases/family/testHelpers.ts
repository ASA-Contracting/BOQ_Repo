import type { Family } from "@/domain/family/Family";
import type { FamilyLevelType } from "@/domain/family/FamilyLevelType";
import { toFamilyId, toFamilyLevelTypeId } from "@/domain/family/ids";
import { createRequestContextValue } from "@/domain/shared/RequestContext";
import { toCorrelationId, toUserId } from "@/domain/shared/ids";
import type { IFamilyLevelTypeRepository } from "@/domain/family/repositories/IFamilyLevelTypeRepository";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";

export const adminContext = createRequestContextValue({
  userId: toUserId("admin-user"),
  roles: ["system_administrator"],
  correlationId: toCorrelationId("corr-admin"),
});

export const viewerContext = createRequestContextValue({
  userId: toUserId("viewer-user"),
  roles: ["viewer"],
  correlationId: toCorrelationId("corr-viewer"),
});

export const unauthenticatedContext = createRequestContextValue({
  userId: toUserId(""),
  roles: [],
  correlationId: toCorrelationId("corr-anon"),
});

export const tradeLevelType: FamilyLevelType = {
  id: toFamilyLevelTypeId(1),
  name: "Trade",
};

export const rootFamily: Family = {
  id: toFamilyId(10),
  name: "Mechanical",
  referenceCode: "MECH",
  description: "Mechanical systems",
  familyLevelTypeId: tradeLevelType.id,
  parentId: null,
};

export const childFamily: Family = {
  id: toFamilyId(11),
  name: "HVAC",
  referenceCode: null,
  description: null,
  familyLevelTypeId: tradeLevelType.id,
  parentId: rootFamily.id,
};

export function createMemoryUnitOfWork(): IUnitOfWork {
  return {
    runInTransaction: async (work) => work(),
  };
}

export function createFamilyRepositoryMock(
  overrides: Partial<IFamilyRepository> = {},
): IFamilyRepository {
  return {
    findById: async () => null,
    findAllFlat: async () => [],
    search: async () => [],
    findChildren: async () => [],
    findSiblingNames: async () => [],
    getAncestorIds: async () => [],
    getReferenceCounts: async () => ({
      childCount: 0,
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
    create: async (family) => ({
      id: toFamilyId(99),
      ...family,
    }),
    update: async (family) => family,
    delete: async () => undefined,
    ...overrides,
  };
}

export function createFamilyLevelTypeRepositoryMock(
  overrides: Partial<IFamilyLevelTypeRepository> = {},
): IFamilyLevelTypeRepository {
  return {
    findAll: async () => [tradeLevelType],
    findById: async (id) => (id === tradeLevelType.id ? tradeLevelType : null),
    ...overrides,
  };
}
