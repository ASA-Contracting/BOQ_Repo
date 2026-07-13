import type {
  BoqBreakdownItemsPageDto,
  ListBoqBreakdownItemsInput,
} from "@/application/boq/dto";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IBoqReadRepository } from "@/application/ports/IBoqReadRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import { ValidationError } from "@/domain/shared/errors/ValidationError";

export type ListBoqBreakdownItemsDependencies = {
  boqReadRepository: IBoqReadRepository;
};

export class ListBoqBreakdownItemsUseCase
  implements IUseCase<ListBoqBreakdownItemsInput, BoqBreakdownItemsPageDto, DomainError>
{
  constructor(private readonly deps: ListBoqBreakdownItemsDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ListBoqBreakdownItemsInput,
  ): Promise<Result<BoqBreakdownItemsPageDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!Number.isFinite(input.boqId) || input.boqId <= 0) {
      return err(new ValidationError("Invalid BOQ id.", { field: "boqId" }));
    }

    const page = await this.deps.boqReadRepository.listBoqBreakdownItems(input);
    return ok(page);
  }
}
