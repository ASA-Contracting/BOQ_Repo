import { describe, expect, it } from "vitest";

import { GetFamilyUseCase } from "@/application/use-cases/family/GetFamilyUseCase";
import { FamilyNotFoundError } from "@/domain/family/errors/FamilyErrors";
import {
  childFamily,
  createFamilyLevelTypeRepositoryMock,
  createFamilyRepositoryMock,
  rootFamily,
  unauthenticatedContext,
  viewerContext,
} from "@/application/use-cases/family/testHelpers";

describe("GetFamilyUseCase", () => {
  it("returns family detail with level type and parent summary", async () => {
    const useCase = new GetFamilyUseCase({
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
      }),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
    });

    const result = await useCase.execute(viewerContext, {
      familyId: childFamily.id as number,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("HVAC");
      expect(result.value.familyLevelTypeName).toBe("Trade");
      expect(result.value.parent?.name).toBe("Mechanical");
    }
  });

  it("returns not found when the family does not exist", async () => {
    const useCase = new GetFamilyUseCase({
      familyRepository: createFamilyRepositoryMock(),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
    });

    const result = await useCase.execute(viewerContext, { familyId: 404 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FamilyNotFoundError);
    }
  });

  it("denies unauthenticated users", async () => {
    const useCase = new GetFamilyUseCase({
      familyRepository: createFamilyRepositoryMock(),
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
    });

    const result = await useCase.execute(unauthenticatedContext, {
      familyId: rootFamily.id as number,
    });

    expect(result.ok).toBe(false);
  });
});
