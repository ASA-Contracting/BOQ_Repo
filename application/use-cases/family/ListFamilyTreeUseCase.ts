import type { FamilyTreeNodeDto } from "@/application/dto/family/familyDto";
import { mapFamiliesToTree } from "@/application/mappers/family/familyTreeMapper";
import type { IUseCaseWithoutInput } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export type ListFamilyTreeDependencies = {
  familyRepository: IFamilyRepository;
};

export class ListFamilyTreeUseCase
  implements IUseCaseWithoutInput<FamilyTreeNodeDto[], DomainError>
{
  constructor(private readonly deps: ListFamilyTreeDependencies) {}

  async execute(
    ctx: RequestContext,
  ): Promise<Result<FamilyTreeNodeDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const families = await this.deps.familyRepository.findAllFlat();
    return ok(mapFamiliesToTree(families));
  }
}
