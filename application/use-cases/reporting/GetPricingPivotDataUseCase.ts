import { toPricingPivotDatasetDto } from "@/application/mappers/reporting/pricingPivotMapper";
import type { PricingPivotDatasetDto } from "@/application/dto/reporting/pricingPivotDto";
import type { IUseCaseWithoutInput } from "@/application/use-cases/IUseCase";
import type { IPricingPivotRepository } from "@/domain/reporting/repositories/IPricingPivotRepository";
import { requirePermission } from "@/domain/shared/authorization/requirePermission";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export type GetPricingPivotDataDependencies = {
  pricingPivotRepository: IPricingPivotRepository;
};

export class GetPricingPivotDataUseCase
  implements IUseCaseWithoutInput<PricingPivotDatasetDto, DomainError>
{
  constructor(private readonly deps: GetPricingPivotDataDependencies) {}

  async execute(
    ctx: RequestContext,
  ): Promise<Result<PricingPivotDatasetDto, DomainError>> {
    const auth = requirePermission(ctx, "view_reports");
    if (!auth.ok) {
      return auth;
    }

    const dataset = await this.deps.pricingPivotRepository.listPricingPivotRows();
    return ok(toPricingPivotDatasetDto(dataset));
  }
}
