import { describe, expect, it } from "vitest";

import { SearchFamiliesUseCase } from "@/application/use-cases/family/SearchFamiliesUseCase";
import {
  childFamily,
  createFamilyRepositoryMock,
  unauthenticatedContext,
  viewerContext,
} from "@/application/use-cases/family/testHelpers";

describe("SearchFamiliesUseCase", () => {
  it("returns mapped search results for authenticated users", async () => {
    const useCase = new SearchFamiliesUseCase({
      familyRepository: createFamilyRepositoryMock({
        search: async (query, limit) => {
          expect(query).toBe("HVAC");
          expect(limit).toBe(20);
          return [childFamily];
        },
      }),
    });

    const result = await useCase.execute(viewerContext, {
      query: "HVAC",
      limit: 20,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.name).toBe("HVAC");
    }
  });

  it("denies unauthenticated users", async () => {
    const useCase = new SearchFamiliesUseCase({
      familyRepository: createFamilyRepositoryMock(),
    });

    const result = await useCase.execute(unauthenticatedContext, {
      query: "HVAC",
      limit: 20,
    });

    expect(result.ok).toBe(false);
  });
});
