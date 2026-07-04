import type { BoqListEntryDto } from "@/application/boq/dto";
import type { IUseCaseWithoutInput } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IBoqReadRepository } from "@/application/ports/IBoqReadRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export type ListBoqsDependencies = {
  boqReadRepository: IBoqReadRepository;
};

export class ListBoqsUseCase
  implements IUseCaseWithoutInput<BoqListEntryDto[], DomainError>
{
  constructor(private readonly deps: ListBoqsDependencies) {}

  async execute(ctx: RequestContext): Promise<Result<BoqListEntryDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const boqs = await this.deps.boqReadRepository.listBoqs();
    return ok(boqs);
  }
}
