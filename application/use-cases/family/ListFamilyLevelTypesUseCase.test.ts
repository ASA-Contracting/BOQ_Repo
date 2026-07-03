import { describe, expect, it } from "vitest";

import { ListFamilyLevelTypesUseCase } from "@/application/use-cases/family/ListFamilyLevelTypesUseCase";
import {
  createFamilyLevelTypeRepositoryMock,
  tradeLevelType,
  unauthenticatedContext,
  viewerContext,
} from "@/application/use-cases/family/testHelpers";

describe("ListFamilyLevelTypesUseCase", () => {
  it("returns mapped level types for authenticated users", async () => {
    const useCase = new ListFamilyLevelTypesUseCase({
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
    });

    const result = await useCase.execute(viewerContext);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([
        {
          id: tradeLevelType.id as number,
          name: "Trade",
        },
      ]);
    }
  });

  it("denies unauthenticated users", async () => {
    const useCase = new ListFamilyLevelTypesUseCase({
      familyLevelTypeRepository: createFamilyLevelTypeRepositoryMock(),
    });

    const result = await useCase.execute(unauthenticatedContext);
    expect(result.ok).toBe(false);
  });
});
