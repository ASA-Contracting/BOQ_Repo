import type { DuplicateBoqVersionInput, DuplicateBoqVersionResult } from "@/application/boq/dto";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeWorkshopImport } from "@/application/use-cases/workshop/authorizeWorkshopImport";
import type { IBoqVersionRepository } from "@/domain/boq/repositories/IBoqVersionRepository";
import { toBoqId, toBoqVersionId } from "@/domain/boq/ids";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import { ValidationError } from "@/domain/shared/errors/ValidationError";

export type DuplicateBoqVersionDependencies = {
  boqVersionRepository: IBoqVersionRepository;
};

export class DuplicateBoqVersionUseCase
  implements IUseCase<DuplicateBoqVersionInput, DuplicateBoqVersionResult, DomainError>
{
  constructor(private readonly deps: DuplicateBoqVersionDependencies) {}

  async execute(
    ctx: RequestContext,
    input: DuplicateBoqVersionInput,
  ): Promise<Result<DuplicateBoqVersionResult, DomainError>> {
    const auth = authorizeWorkshopImport(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!Number.isFinite(input.boqId) || input.boqId <= 0) {
      return err(new ValidationError("Invalid BOQ id.", { field: "boqId" }));
    }

    if (!Number.isFinite(input.sourceVersionId) || input.sourceVersionId <= 0) {
      return err(new ValidationError("Invalid source version id.", { field: "sourceVersionId" }));
    }

    const source = await this.deps.boqVersionRepository.findById(
      toBoqVersionId(input.sourceVersionId),
    );
    if (!source || source.boqId !== input.boqId) {
      return err(new ValidationError("Source BOQ version not found.", { field: "sourceVersionId" }));
    }

    const duplicated = await this.deps.boqVersionRepository.duplicateAsDraft({
      boqId: toBoqId(input.boqId),
      sourceVersionId: toBoqVersionId(input.sourceVersionId),
      createdBy: ctx.userId,
    });

    return ok({
      boqId: input.boqId,
      versionId: duplicated.versionId as number,
    });
  }
}
