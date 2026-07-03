import type { CreateFamilyInput } from "@/application/dto/family/createFamilySchema";
import type { FamilyDetailDto } from "@/application/dto/family/familyDto";
import { mapFamilyToDetailDto } from "@/application/mappers/family/familyMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeFamilyAdmin } from "@/application/use-cases/family/authorizeFamilyAdmin";
import {
  FamilyLevelTypeNotFoundError,
  FamilyNotFoundError,
} from "@/domain/family/errors/FamilyErrors";
import {
  assertUniqueSiblingName,
  validateDescription,
  validateName,
  validateReferenceCode,
} from "@/domain/family/familyValidators";
import { toFamilyId, toFamilyLevelTypeId, type FamilyId } from "@/domain/family/ids";
import type { IFamilyLevelTypeRepository } from "@/domain/family/repositories/IFamilyLevelTypeRepository";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type CreateFamilyDependencies = {
  familyRepository: IFamilyRepository;
  familyLevelTypeRepository: IFamilyLevelTypeRepository;
  unitOfWork: IUnitOfWork;
};

export class CreateFamilyUseCase
  implements IUseCase<CreateFamilyInput, FamilyDetailDto, DomainError>
{
  constructor(private readonly deps: CreateFamilyDependencies) {}

  async execute(
    ctx: RequestContext,
    input: CreateFamilyInput,
  ): Promise<Result<FamilyDetailDto, DomainError>> {
    const auth = authorizeFamilyAdmin(ctx);
    if (!auth.ok) {
      return auth;
    }

    const validatedFields = this.validateFields(input);
    if (!validatedFields.ok) {
      return validatedFields;
    }

    const familyLevelTypeId = toFamilyLevelTypeId(input.familyLevelTypeId);
    const levelType =
      await this.deps.familyLevelTypeRepository.findById(familyLevelTypeId);
    if (!levelType) {
      return err(new FamilyLevelTypeNotFoundError(familyLevelTypeId));
    }

    const parentId = await this.resolveParentId(input.parentId);
    if (!parentId.ok) {
      return parentId;
    }

    const siblingCheck = await this.assertUniqueSibling(
      validatedFields.value.name,
      parentId.value,
    );
    if (!siblingCheck.ok) {
      return siblingCheck;
    }

    const created = await this.deps.unitOfWork.runInTransaction(() =>
      this.deps.familyRepository.create({
        name: validatedFields.value.name,
        referenceCode: validatedFields.value.referenceCode,
        description: validatedFields.value.description,
        familyLevelTypeId,
        parentId: parentId.value,
      }),
    );

    const parent = parentId.value
      ? await this.deps.familyRepository.findById(parentId.value)
      : null;

    return ok(mapFamilyToDetailDto(created, levelType.name, parent));
  }

  private validateFields(input: CreateFamilyInput) {
    const nameResult = validateName(input.name);
    if (!nameResult.ok) {
      return nameResult;
    }

    const referenceCodeResult = validateReferenceCode(input.referenceCode ?? null);
    if (!referenceCodeResult.ok) {
      return referenceCodeResult;
    }

    const descriptionResult = validateDescription(input.description ?? null);
    if (!descriptionResult.ok) {
      return descriptionResult;
    }

    return ok({
      name: nameResult.value,
      referenceCode: referenceCodeResult.value,
      description: descriptionResult.value,
    });
  }

  private async resolveParentId(
    parentId: number | null | undefined,
  ): Promise<Result<FamilyId | null, DomainError>> {
    if (parentId === undefined || parentId === null) {
      return ok(null);
    }

    const resolvedParentId = toFamilyId(parentId);
    const parent = await this.deps.familyRepository.findById(resolvedParentId);
    if (!parent) {
      return err(new FamilyNotFoundError(resolvedParentId));
    }

    return ok(resolvedParentId);
  }

  private async assertUniqueSibling(name: string, parentId: FamilyId | null) {
    const siblingNames =
      await this.deps.familyRepository.findSiblingNames(parentId);
    return assertUniqueSiblingName(name, siblingNames);
  }
}
