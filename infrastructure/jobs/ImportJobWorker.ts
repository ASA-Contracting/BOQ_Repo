import type { ProcessImportJobsUseCase } from "@/application/use-cases/workshop/ProcessImportJobsUseCase";
import type { RequestContext } from "@/domain/shared/RequestContext";

export type ImportJobWorkerInput = {
  campaignId: number;
  maxJobs?: number;
};

export class ImportJobWorker {
  constructor(
    private readonly deps: {
      processImportJobsUseCase: ProcessImportJobsUseCase;
    },
  ) {}

  async run(ctx: RequestContext, input: ImportJobWorkerInput) {
    return this.deps.processImportJobsUseCase.execute(ctx, {
      campaignId: input.campaignId,
      maxJobs: input.maxJobs ?? 3,
    });
  }
}
