import type { FamilyLevelTypeDto } from "@/application/dto/family/familyDto";
import { mapFamilyLevelTypeToDto } from "@/application/mappers/family/familyMapper";
import type { IUseCaseWithoutInput } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IFamilyLevelTypeRepository } from "@/domain/family/repositories/IFamilyLevelTypeRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export type ListFamilyLevelTypesDependencies = {
  familyLevelTypeRepository: IFamilyLevelTypeRepository;
};

export class ListFamilyLevelTypesUseCase
  implements IUseCaseWithoutInput<FamilyLevelTypeDto[], DomainError>
{
  constructor(private readonly deps: ListFamilyLevelTypesDependencies) {}

  async execute(
    ctx: RequestContext,
  ): Promise<Result<FamilyLevelTypeDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const levelTypes = await this.deps.familyLevelTypeRepository.findAll();
    return ok(levelTypes.map(mapFamilyLevelTypeToDto));
  }
}
