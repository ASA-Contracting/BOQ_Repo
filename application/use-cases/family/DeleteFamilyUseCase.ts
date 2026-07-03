import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeFamilyAdmin } from "@/application/use-cases/family/authorizeFamilyAdmin";
import { FamilyNotFoundError } from "@/domain/family/errors/FamilyErrors";
import { canDelete } from "@/domain/family/familyValidators";
import { toFamilyId } from "@/domain/family/ids";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type DeleteFamilyInput = {
  familyId: number;
};

export type DeleteFamilyDependencies = {
  familyRepository: IFamilyRepository;
  unitOfWork: IUnitOfWork;
};

export class DeleteFamilyUseCase
  implements IUseCase<DeleteFamilyInput, void, DomainError>
{
  constructor(private readonly deps: DeleteFamilyDependencies) {}

  async execute(
    ctx: RequestContext,
    input: DeleteFamilyInput,
  ): Promise<Result<void, DomainError>> {
    const auth = authorizeFamilyAdmin(ctx);
    if (!auth.ok) {
      return auth;
    }

    const familyId = toFamilyId(input.familyId);
    const existing = await this.deps.familyRepository.findById(familyId);
    if (!existing) {
      return err(new FamilyNotFoundError(familyId));
    }

    const referenceCounts =
      await this.deps.familyRepository.getReferenceCounts(familyId);
    const deleteCheck = canDelete(familyId, referenceCounts);
    if (!deleteCheck.ok) {
      return deleteCheck;
    }

    await this.deps.unitOfWork.runInTransaction(() =>
      this.deps.familyRepository.delete(familyId),
    );

    return ok(undefined);
  }
}
