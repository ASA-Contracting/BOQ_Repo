import type { BoqVersionSummaryDto, ListBoqVersionsInput } from "@/application/boq/dto";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IBoqReadRepository } from "@/application/ports/IBoqReadRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export type ListBoqVersionsDependencies = {
  boqReadRepository: IBoqReadRepository;
};

export class ListBoqVersionsUseCase
  implements IUseCase<ListBoqVersionsInput, BoqVersionSummaryDto[], DomainError>
{
  constructor(private readonly deps: ListBoqVersionsDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ListBoqVersionsInput,
  ): Promise<Result<BoqVersionSummaryDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!Number.isFinite(input.boqId) || input.boqId <= 0) {
      return ok([]);
    }

    const versions = await this.deps.boqReadRepository.listBoqVersions(
      input.boqId,
      input.currentVersionId,
    );

    if (versions.length === 0) {
      return ok([]);
    }

    return ok(versions);
  }
}
