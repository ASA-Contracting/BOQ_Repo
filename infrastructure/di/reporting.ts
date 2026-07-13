import { ComputePricingPivotUseCase } from "@/application/use-cases/reporting/ComputePricingPivotUseCase";
import { GetPricingPivotDataUseCase } from "@/application/use-cases/reporting/GetPricingPivotDataUseCase";
import { GetPricingPivotFieldValuesUseCase } from "@/application/use-cases/reporting/GetPricingPivotFieldValuesUseCase";
import type { IPricingPivotRepository } from "@/domain/reporting/repositories/IPricingPivotRepository";
import { DrizzlePricingPivotRepository } from "@/infrastructure/persistence/reporting/DrizzlePricingPivotRepository";

export type ReportingServices = {
  pricingPivotRepository: IPricingPivotRepository;
  getPricingPivotDataUseCase: GetPricingPivotDataUseCase;
  computePricingPivotUseCase: ComputePricingPivotUseCase;
  getPricingPivotFieldValuesUseCase: GetPricingPivotFieldValuesUseCase;
};

export function createReportingServices(): ReportingServices {
  const pricingPivotRepository = new DrizzlePricingPivotRepository();

  return {
    pricingPivotRepository,
    getPricingPivotDataUseCase: new GetPricingPivotDataUseCase({
      pricingPivotRepository,
    }),
    computePricingPivotUseCase: new ComputePricingPivotUseCase({
      pricingPivotRepository,
    }),
    getPricingPivotFieldValuesUseCase: new GetPricingPivotFieldValuesUseCase({
      pricingPivotRepository,
    }),
  };
}
