import type { BoqBreakdownDto, GetBoqBreakdownInput } from "@/application/boq/dto";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IBoqReadRepository } from "@/application/ports/IBoqReadRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import { ValidationError } from "@/domain/shared/errors/ValidationError";

export type GetBoqBreakdownDependencies = {
  boqReadRepository: IBoqReadRepository;
};

export class GetBoqBreakdownUseCase
  implements IUseCase<GetBoqBreakdownInput, BoqBreakdownDto, DomainError>
{
  constructor(private readonly deps: GetBoqBreakdownDependencies) {}

  async execute(
    ctx: RequestContext,
    input: GetBoqBreakdownInput,
  ): Promise<Result<BoqBreakdownDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!Number.isFinite(input.boqId) || input.boqId <= 0) {
      return err(new ValidationError("Invalid BOQ id.", { field: "boqId" }));
    }

    const breakdown = await this.deps.boqReadRepository.getBoqBreakdown(input.boqId);
    if (!breakdown) {
      return err(new ValidationError("BOQ not found.", { field: "boqId" }));
    }

    return ok(breakdown);
  }
}
