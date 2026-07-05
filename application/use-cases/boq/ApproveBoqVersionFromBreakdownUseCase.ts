import type {
  ApproveBoqVersionFromBreakdownInput,
  ApproveBoqVersionFromBreakdownResult,
} from "@/application/boq/dto";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeBoqVersionApproval } from "@/application/use-cases/boq/authorizeBoqVersionApproval";
import type { IBoqReadRepository } from "@/application/ports/IBoqReadRepository";
import type { IBoqVersionRepository } from "@/domain/boq/repositories/IBoqVersionRepository";
import { toBoqId, toBoqVersionId } from "@/domain/boq/ids";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import { ValidationError } from "@/domain/shared/errors/ValidationError";

export type ApproveBoqVersionFromBreakdownDependencies = {
  boqReadRepository: IBoqReadRepository;
  boqVersionRepository: IBoqVersionRepository;
};

export class ApproveBoqVersionFromBreakdownUseCase
  implements
    IUseCase<
      ApproveBoqVersionFromBreakdownInput,
      ApproveBoqVersionFromBreakdownResult,
      DomainError
    >
{
  constructor(private readonly deps: ApproveBoqVersionFromBreakdownDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ApproveBoqVersionFromBreakdownInput,
  ): Promise<Result<ApproveBoqVersionFromBreakdownResult, DomainError>> {
    const auth = authorizeBoqVersionApproval(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!Number.isFinite(input.boqId) || input.boqId <= 0) {
      return err(new ValidationError("Invalid BOQ id.", { field: "boqId" }));
    }

    if (!Number.isFinite(input.versionId) || input.versionId <= 0) {
      return err(new ValidationError("Invalid version id.", { field: "versionId" }));
    }

    const version = await this.deps.boqVersionRepository.findById(
      toBoqVersionId(input.versionId),
    );
    if (!version || version.boqId !== input.boqId) {
      return err(new ValidationError("BOQ version not found.", { field: "versionId" }));
    }

    if (version.approvalStatus === "approved") {
      return err(
        new ValidationError("This version is already approved.", { field: "versionId" }),
      );
    }

    const versionNumber =
      version.versionNumber ??
      (await this.deps.boqVersionRepository.getNextVersionNumber(toBoqId(input.boqId)));
    const versionName = `Version ${versionNumber}`;

    await this.deps.boqVersionRepository.updateApprovalStatus(
      toBoqVersionId(input.versionId),
      {
        approvalStatus: "approved",
        versionName,
        versionNumber,
      },
    );

    return ok({
      versionId: input.versionId,
      versionNumber,
      versionName,
    });
  }
}
