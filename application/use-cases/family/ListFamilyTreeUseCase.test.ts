import { describe, expect, it } from "vitest";

import { ListFamilyTreeUseCase } from "@/application/use-cases/family/ListFamilyTreeUseCase";
import {
  adminContext,
  childFamily,
  createFamilyRepositoryMock,
  rootFamily,
  unauthenticatedContext,
  viewerContext,
} from "@/application/use-cases/family/testHelpers";

describe("ListFamilyTreeUseCase", () => {
  it("returns a nested tree for authenticated users", async () => {
    const useCase = new ListFamilyTreeUseCase({
      familyRepository: createFamilyRepositoryMock({
        findAllFlat: async () => [rootFamily, childFamily],
      }),
    });

    const result = await useCase.execute(viewerContext);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.id).toBe(rootFamily.id as number);
      expect(result.value[0]?.children[0]?.id).toBe(childFamily.id as number);
    }
  });

  it("denies unauthenticated users", async () => {
    const useCase = new ListFamilyTreeUseCase({
      familyRepository: createFamilyRepositoryMock(),
    });

    const result = await useCase.execute(unauthenticatedContext);
    expect(result.ok).toBe(false);
  });

  it("allows non-admin authenticated users", async () => {
    const useCase = new ListFamilyTreeUseCase({
      familyRepository: createFamilyRepositoryMock({
        findAllFlat: async () => [rootFamily],
      }),
    });

    const result = await useCase.execute(adminContext);
    expect(result.ok).toBe(true);
  });
});
