import { describe, expect, it } from "vitest";

import { CreateFamilyUseCase } from "@/application/use-cases/family/CreateFamilyUseCase";
import {
  DuplicateSiblingNameError,
  FamilyLevelTypeNotFoundError,
  FamilyNotFoundError,
} from "@/domain/family/errors/FamilyErrors";
import { toFamilyId } from "@/domain/family/ids";
import {
  adminContext,
  childFamily,
  createFamilyLevelTypeRepositoryMock,
  createFamilyRepositoryMock,
  createMemoryUnitOfWork,
  rootFamily,
  tradeLevelType,
  viewerContext,
} from "@/application/use-cases/family/testHelpers";

describe("CreateFamilyUseCase", () => {
  it("creates a family for system administrators", async () => {
    let created = false;

    const useCase = new CreateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock({
        findSiblingNames: async () => [],
        create: async (family) => {
          created = true;
          return {
            id: toFamilyId(50),
            ...family,
          };
        },
      }),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      name: "Plumbing",
      referenceCode: "PL-01",
      description: "Plumbing systems",
      familyLevelTypeId: tradeLevelType.id as number,
      parentId: null,
    });

    expect(created).toBe(true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Plumbing");
      expect(result.value.familyLevelTypeName).toBe("Trade");
    }
  });

  it("denies non-administrators", async () => {
    const useCase = new CreateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock(),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(viewerContext, {
      name: "Plumbing",
      familyLevelTypeId: tradeLevelType.id as number,
    });

    expect(result.ok).toBe(false);
  });

  it("returns not found when parent does not exist", async () => {
    const useCase = new CreateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock(),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      name: "Plumbing",
      familyLevelTypeId: tradeLevelType.id as number,
      parentId: 999,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FamilyNotFoundError);
    }
  });

  it("returns not found when level type does not exist", async () => {
    const useCase = new CreateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock(),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock({
        findById: async () => null,
      }),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      name: "Plumbing",
      familyLevelTypeId: 999,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FamilyLevelTypeNotFoundError);
    }
  });

  it("rejects duplicate sibling names", async () => {
    const useCase = new CreateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock({
        findById: async (id) => (id === rootFamily.id ? rootFamily : null),
        findSiblingNames: async () => [childFamily.name],
      }),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      name: "hvac",
      familyLevelTypeId: tradeLevelType.id as number,
      parentId: rootFamily.id as number,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(DuplicateSiblingNameError);
    }
  });

  it("rejects invalid names through domain validation", async () => {
    const useCase = new CreateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock(),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      name: "   ",
      familyLevelTypeId: tradeLevelType.id as number,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
