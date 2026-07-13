import type { PricingPivotQueryDto } from "@/application/dto/reporting/pricingPivotQueryDto";
import type { PricingPivotResponseDto } from "@/application/dto/reporting/pricingPivotResponseDto";
import { computePricingPivotResponse } from "@/application/services/reporting/pricingPivotComputation";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import type { IPricingPivotRepository } from "@/domain/reporting/repositories/IPricingPivotRepository";
import { requirePermission } from "@/domain/shared/authorization/requirePermission";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export type ComputePricingPivotDependencies = {
  pricingPivotRepository: IPricingPivotRepository;
};

export class ComputePricingPivotUseCase
  implements IUseCase<PricingPivotQueryDto, PricingPivotResponseDto, DomainError>
{
  constructor(private readonly deps: ComputePricingPivotDependencies) {}

  async execute(
    ctx: RequestContext,
    input: PricingPivotQueryDto,
  ): Promise<Result<PricingPivotResponseDto, DomainError>> {
    const auth = requirePermission(ctx, "view_reports");
    if (!auth.ok) {
      return auth;
    }

    const dataset = await this.deps.pricingPivotRepository.listPricingPivotRows();
    return ok(computePricingPivotResponse(dataset, input));
  }
}
