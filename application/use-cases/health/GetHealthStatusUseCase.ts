import type { HealthStatusDto } from "@/application/dto/health";
import type { IPublicUseCase } from "@/application/use-cases/IUseCase";
import type { IDatabaseHealthRepository } from "@/domain/shared/persistence/IDatabaseHealthRepository";

export type GetHealthStatusDependencies = {
  databaseHealthRepository: IDatabaseHealthRepository;
  isSupabaseConfigured: () => boolean;
  appVersion: string;
};

export class GetHealthStatusUseCase implements IPublicUseCase<HealthStatusDto> {
  constructor(private readonly deps: GetHealthStatusDependencies) {}

  async execute(): Promise<HealthStatusDto> {
    let database: HealthStatusDto["checks"]["database"] = "error";

    try {
      database = (await this.deps.databaseHealthRepository.checkConnection())
        ? "ok"
        : "error";
    } catch {
      database = "error";
    }

    const supabase: HealthStatusDto["checks"]["supabase"] = this.deps
      .isSupabaseConfigured()
      ? "ok"
      : "error";

    const status = database === "ok" && supabase === "ok" ? "ok" : "degraded";

    return {
      status,
      checks: { database, supabase },
      version: this.deps.appVersion,
      timestamp: new Date().toISOString(),
    };
  }
}

export function getHealthHttpStatus(dto: HealthStatusDto): number {
  return dto.status === "ok" ? 200 : 503;
}
