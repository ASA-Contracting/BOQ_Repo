import type { ListBoqsInput, ListBoqsPageDto } from "@/application/boq/dto";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IBoqReadRepository } from "@/application/ports/IBoqReadRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export type ListBoqsPaginatedDependencies = {
  boqReadRepository: IBoqReadRepository;
};

export class ListBoqsPaginatedUseCase
  implements IUseCase<ListBoqsInput, ListBoqsPageDto, DomainError>
{
  constructor(private readonly deps: ListBoqsPaginatedDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ListBoqsInput,
  ): Promise<Result<ListBoqsPageDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const page = await this.deps.boqReadRepository.listBoqsPaginated(input);
    return ok(page);
  }
}
