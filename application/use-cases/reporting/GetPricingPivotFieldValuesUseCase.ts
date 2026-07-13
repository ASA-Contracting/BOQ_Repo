import type { PricingPivotFieldValuesQueryDto } from "@/application/dto/reporting/pricingPivotQueryDto";
import type { PricingPivotFieldValuesResponseDto } from "@/application/dto/reporting/pricingPivotResponseDto";
import { computePricingPivotFieldValues } from "@/application/services/reporting/pricingPivotComputation";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import type { IPricingPivotRepository } from "@/domain/reporting/repositories/IPricingPivotRepository";
import { requirePermission } from "@/domain/shared/authorization/requirePermission";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export type GetPricingPivotFieldValuesDependencies = {
  pricingPivotRepository: IPricingPivotRepository;
};

export class GetPricingPivotFieldValuesUseCase
  implements
    IUseCase<PricingPivotFieldValuesQueryDto, PricingPivotFieldValuesResponseDto, DomainError>
{
  constructor(private readonly deps: GetPricingPivotFieldValuesDependencies) {}

  async execute(
    ctx: RequestContext,
    input: PricingPivotFieldValuesQueryDto,
  ): Promise<Result<PricingPivotFieldValuesResponseDto, DomainError>> {
    const auth = requirePermission(ctx, "view_reports");
    if (!auth.ok) {
      return auth;
    }

    const dataset = await this.deps.pricingPivotRepository.listPricingPivotRows();
    const options = computePricingPivotFieldValues(
      dataset,
      input.field,
      input.valueFilter,
      input.gridSearch,
    );

    return ok({ options });
  }
}
