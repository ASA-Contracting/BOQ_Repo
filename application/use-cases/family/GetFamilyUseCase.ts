import type { FamilyDetailDto } from "@/application/dto/family/familyDto";
import { mapFamilyToDetailDto } from "@/application/mappers/family/familyMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import { FamilyNotFoundError } from "@/domain/family/errors/FamilyErrors";
import { toFamilyId, type FamilyId } from "@/domain/family/ids";
import type { IFamilyLevelTypeRepository } from "@/domain/family/repositories/IFamilyLevelTypeRepository";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type GetFamilyInput = {
  familyId: number;
};

export type GetFamilyDependencies = {
  familyRepository: IFamilyRepository;
  familyLevelTypeRepository: IFamilyLevelTypeRepository;
};

export class GetFamilyUseCase
  implements IUseCase<GetFamilyInput, FamilyDetailDto, DomainError>
{
  constructor(private readonly deps: GetFamilyDependencies) {}

  async execute(
    ctx: RequestContext,
    input: GetFamilyInput,
  ): Promise<Result<FamilyDetailDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const familyId = toFamilyId(input.familyId);
    const family = await this.deps.familyRepository.findById(familyId);
    if (!family) {
      return err(new FamilyNotFoundError(familyId));
    }

    const levelType = await this.deps.familyLevelTypeRepository.findById(
      family.familyLevelTypeId,
    );

    const parent = await this.loadParent(family.parentId);

    return ok(
      mapFamilyToDetailDto(
        family,
        levelType?.name ?? "Unknown",
        parent,
      ),
    );
  }

  private async loadParent(parentId: FamilyId | null) {
    if (parentId === null) {
      return null;
    }

    return this.deps.familyRepository.findById(parentId);
  }
}
