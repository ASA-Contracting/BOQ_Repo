import type { SearchFamiliesInput } from "@/application/dto/family/searchFamiliesSchema";
import type { FamilyListItemDto } from "@/application/dto/family/familyDto";
import { mapFamilyToListItemDto } from "@/application/mappers/family/familyMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export type SearchFamiliesDependencies = {
  familyRepository: IFamilyRepository;
};

export class SearchFamiliesUseCase
  implements IUseCase<SearchFamiliesInput, FamilyListItemDto[], DomainError>
{
  constructor(private readonly deps: SearchFamiliesDependencies) {}

  async execute(
    ctx: RequestContext,
    input: SearchFamiliesInput,
  ): Promise<Result<FamilyListItemDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const families = await this.deps.familyRepository.search(
      input.query,
      input.limit,
    );

    return ok(families.map(mapFamilyToListItemDto));
  }
}
