import { beforeEach, describe, expect, it } from "vitest";

import { DrizzleFamilyLevelTypeRepository } from "@/infrastructure/persistence/family/DrizzleFamilyLevelTypeRepository";
import { DrizzleFamilyRepository } from "@/infrastructure/persistence/family/DrizzleFamilyRepository";
import { createFamilyServices } from "@/infrastructure/di/family";
import {
  createAppServices,
  getAppServices,
  resetAppServices,
} from "@/infrastructure/di/container";

describe("createFamilyServices", () => {
  it("registers family repositories and use cases", () => {
    const services = createFamilyServices({
      unitOfWork: { runInTransaction: async (work) => work() },
    });

    expect(services.familyRepository).toBeInstanceOf(DrizzleFamilyRepository);
    expect(services.familyLevelTypeRepository).toBeInstanceOf(
      DrizzleFamilyLevelTypeRepository,
    );
    expect(services.listFamilyTreeUseCase).toBeDefined();
    expect(services.searchFamiliesUseCase).toBeDefined();
    expect(services.getFamilyUseCase).toBeDefined();
    expect(services.listFamilyLevelTypesUseCase).toBeDefined();
    expect(services.createFamilyUseCase).toBeDefined();
    expect(services.updateFamilyUseCase).toBeDefined();
    expect(services.deleteFamilyUseCase).toBeDefined();
  });

  it("creates a distinct family service graph for each createAppServices call", () => {
    const first = createAppServices();
    const second = createAppServices();

    expect(first.family).not.toBe(second.family);
    expect(first.family.familyRepository).not.toBe(
      second.family.familyRepository,
    );
  });
});

describe("family services in app container", () => {
  beforeEach(() => {
    resetAppServices();
  });

  it("exposes family services from createAppServices", () => {
    const services = createAppServices();

    expect(services.family.familyRepository).toBeInstanceOf(
      DrizzleFamilyRepository,
    );
    expect(services.family.deleteFamilyUseCase).toBeDefined();
  });

  it("reuses the application unit of work for family mutations", () => {
    const services = createAppServices();

    expect(services.unitOfWork).toBeDefined();
    expect(services.family.createFamilyUseCase).toBeDefined();
    expect(services.family.updateFamilyUseCase).toBeDefined();
    expect(services.family.deleteFamilyUseCase).toBeDefined();
  });

  it("returns the same family services from getAppServices", () => {
    const first = getAppServices();
    const second = getAppServices();

    expect(first.family).toBe(second.family);
    expect(first.family.listFamilyTreeUseCase).toBe(
      second.family.listFamilyTreeUseCase,
    );
    expect(first.family.familyRepository).toBe(second.family.familyRepository);
  });
});
