import { beforeEach, describe, expect, it } from "vitest";

import { GetHealthStatusUseCase } from "@/application/use-cases/health/GetHealthStatusUseCase";
import type { IDatabaseHealthRepository } from "@/domain/shared/persistence/IDatabaseHealthRepository";

describe("GetHealthStatusUseCase", () => {
  let databaseOk: boolean;
  let supabaseConfigured: boolean;

  const repository: IDatabaseHealthRepository = {
    checkConnection: async () => databaseOk,
  };

  beforeEach(() => {
    databaseOk = true;
    supabaseConfigured = true;
  });

  it("returns ok when all checks pass", async () => {
    const useCase = new GetHealthStatusUseCase({
      databaseHealthRepository: repository,
      isSupabaseConfigured: () => supabaseConfigured,
      appVersion: "1.0.0",
    });

    const result = await useCase.execute();

    expect(result.status).toBe("ok");
    expect(result.checks.database).toBe("ok");
    expect(result.checks.supabase).toBe("ok");
    expect(result.version).toBe("1.0.0");
  });

  it("returns degraded when database check fails", async () => {
    databaseOk = false;

    const useCase = new GetHealthStatusUseCase({
      databaseHealthRepository: repository,
      isSupabaseConfigured: () => supabaseConfigured,
      appVersion: "1.0.0",
    });

    const result = await useCase.execute();

    expect(result.status).toBe("degraded");
    expect(result.checks.database).toBe("error");
  });
});
