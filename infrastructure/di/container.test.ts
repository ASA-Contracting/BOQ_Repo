import { beforeEach, describe, expect, it } from "vitest";

import {
  createAppServices,
  getAppServices,
  resetAppServices,
} from "@/infrastructure/di/container";

describe("dependency injection container", () => {
  beforeEach(() => {
    resetAppServices();
  });

  it("registers core application services", () => {
    const services = createAppServices();

    expect(services.logger).toBeDefined();
    expect(services.unitOfWork).toBeDefined();
    expect(services.databaseHealthRepository).toBeDefined();
    expect(services.authorization).toBeDefined();
    expect(services.getHealthStatusUseCase).toBeDefined();
    expect(services.family).toBeDefined();
    expect(services.family.listFamilyTreeUseCase).toBeDefined();
    expect(services.family.createFamilyUseCase).toBeDefined();
  });

  it("returns singleton services from getAppServices", () => {
    const first = getAppServices();
    const second = getAppServices();

    expect(first).toBe(second);
  });
});
