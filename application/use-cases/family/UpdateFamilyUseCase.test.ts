import { describe, expect, it } from "vitest";

import { UpdateFamilyUseCase } from "@/application/use-cases/family/UpdateFamilyUseCase";
import {
  CircularParentError,
  DuplicateSiblingNameError,
  FamilyNotFoundError,
} from "@/domain/family/errors/FamilyErrors";
import {
  adminContext,
  childFamily,
  createFamilyLevelTypeRepositoryMock,
  createFamilyRepositoryMock,
  createMemoryUnitOfWork,
  rootFamily,
  viewerContext,
} from "@/application/use-cases/family/testHelpers";

describe("UpdateFamilyUseCase", () => {
  it("updates a family for system administrators", async () => {
    const useCase = new UpdateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock({
        findById: async (id) => {
          if (id === childFamily.id) {
            return childFamily;
          }

          if (id === rootFamily.id) {
            return rootFamily;
          }

          return null;
        },
        findSiblingNames: async () => [],
        getAncestorIds: async () => [rootFamily.id],
        update: async (family) => family,
      }),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      id: childFamily.id as number,
      name: "HVAC Updated",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("HVAC Updated");
    }
  });

  it("denies non-administrators", async () => {
    const useCase = new UpdateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock(),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(viewerContext, {
      id: childFamily.id as number,
      name: "Blocked",
    });

    expect(result.ok).toBe(false);
  });

  it("returns not found when the family does not exist", async () => {
    const useCase = new UpdateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock(),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      id: 404,
      name: "Missing",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FamilyNotFoundError);
    }
  });

  it("rejects duplicate sibling names on rename", async () => {
    const useCase = new UpdateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock({
        findById: async (id) => (id === childFamily.id ? childFamily : null),
        findSiblingNames: async () => ["Electrical"],
      }),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      id: childFamily.id as number,
      name: " electrical ",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(DuplicateSiblingNameError);
    }
  });

  it("rejects circular parent assignments", async () => {
    const useCase = new UpdateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock({
        findById: async (id) => {
          if (id === rootFamily.id) {
            return rootFamily;
          }

          if (id === childFamily.id) {
            return childFamily;
          }

          return null;
        },
        findSiblingNames: async () => [],
        getAncestorIds: async (id) =>
          id === childFamily.id ? [rootFamily.id] : [],
        update: async (family) => family,
      }),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      id: rootFamily.id as number,
      parentId: childFamily.id as number,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(CircularParentError);
    }
  });

  it("rejects invalid parent ids", async () => {
    const useCase = new UpdateFamilyUseCase({
      familyRepository: createFamilyRepositoryMock({
        findById: async (id) => (id === childFamily.id ? childFamily : null),
      }),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
      unitOfWork: createMemoryUnitOfWork(),
    });

    const result = await useCase.execute(adminContext, {
      id: childFamily.id as number,
      parentId: 999,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FamilyNotFoundError);
    }
  });
});
