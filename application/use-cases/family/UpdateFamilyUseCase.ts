import type { UpdateFamilyInput } from "@/application/dto/family/updateFamilySchema";
import type { FamilyDetailDto } from "@/application/dto/family/familyDto";
import { mapFamilyToDetailDto } from "@/application/mappers/family/familyMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeFamilyAdmin } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { Family } from "@/domain/family/Family";
import {
  FamilyLevelTypeNotFoundError,
  FamilyNotFoundError,
} from "@/domain/family/errors/FamilyErrors";
import {
  assertAcyclicParent,
  assertUniqueSiblingName,
  validateDescription,
  validateName,
  validateReferenceCode,
} from "@/domain/family/familyValidators";
import {
  toFamilyId,
  toFamilyLevelTypeId,
  type FamilyId,
  type FamilyLevelTypeId,
} from "@/domain/family/ids";
import type { IFamilyLevelTypeRepository } from "@/domain/family/repositories/IFamilyLevelTypeRepository";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type UpdateFamilyDependencies = {
  familyRepository: IFamilyRepository;
  familyLevelTypeRepository: IFamilyLevelTypeRepository;
  unitOfWork: IUnitOfWork;
};

export class UpdateFamilyUseCase
  implements IUseCase<UpdateFamilyInput, FamilyDetailDto, DomainError>
{
  constructor(private readonly deps: UpdateFamilyDependencies) {}

  async execute(
    ctx: RequestContext,
    input: UpdateFamilyInput,
  ): Promise<Result<FamilyDetailDto, DomainError>> {
    const auth = authorizeFamilyAdmin(ctx);
    if (!auth.ok) {
      return auth;
    }

    const familyId = toFamilyId(input.id);
    const existing = await this.deps.familyRepository.findById(familyId);
    if (!existing) {
      return err(new FamilyNotFoundError(familyId));
    }

    const merged = await this.mergeInput(existing, input);
    if (!merged.ok) {
      return merged;
    }

    const siblingCheck = await this.assertUniqueSibling(
      merged.value,
      existing.id,
    );
    if (!siblingCheck.ok) {
      return siblingCheck;
    }

    const cycleCheck = await this.assertAcyclicParentForUpdate(merged.value);
    if (!cycleCheck.ok) {
      return cycleCheck;
    }

    const updated = await this.deps.unitOfWork.runInTransaction(() =>
      this.deps.familyRepository.update(merged.value),
    );

    const levelType = await this.deps.familyLevelTypeRepository.findById(
      updated.familyLevelTypeId,
    );
    const parent = updated.parentId
      ? await this.deps.familyRepository.findById(updated.parentId)
      : null;

    return ok(
      mapFamilyToDetailDto(
        updated,
        levelType?.name ?? "Unknown",
        parent,
      ),
    );
  }

  private async mergeInput(
    existing: Family,
    input: UpdateFamilyInput,
  ): Promise<Result<Family, DomainError>> {
    const nameResult =
      input.name === undefined
        ? ok(existing.name)
        : validateName(input.name);
    if (!nameResult.ok) {
      return nameResult;
    }

    const referenceCodeResult =
      input.referenceCode === undefined
        ? ok(existing.referenceCode)
        : validateReferenceCode(input.referenceCode);
    if (!referenceCodeResult.ok) {
      return referenceCodeResult;
    }

    const descriptionResult =
      input.description === undefined
        ? ok(existing.description)
        : validateDescription(input.description);
    if (!descriptionResult.ok) {
      return descriptionResult;
    }

    const familyLevelTypeId = await this.resolveFamilyLevelTypeId(
      existing.familyLevelTypeId,
      input.familyLevelTypeId,
    );
    if (!familyLevelTypeId.ok) {
      return familyLevelTypeId;
    }

    const parentId = await this.resolveParentId(existing.parentId, input.parentId);
    if (!parentId.ok) {
      return parentId;
    }

    return ok({
      id: existing.id,
      name: nameResult.value,
      referenceCode: referenceCodeResult.value,
      description: descriptionResult.value,
      familyLevelTypeId: familyLevelTypeId.value,
      parentId: parentId.value,
    });
  }

  private async resolveFamilyLevelTypeId(
    current: FamilyLevelTypeId,
    next: number | undefined,
  ): Promise<Result<FamilyLevelTypeId, DomainError>> {
    if (next === undefined) {
      return ok(current);
    }

    const familyLevelTypeId = toFamilyLevelTypeId(next);
    const levelType =
      await this.deps.familyLevelTypeRepository.findById(familyLevelTypeId);
    if (!levelType) {
      return err(new FamilyLevelTypeNotFoundError(familyLevelTypeId));
    }

    return ok(familyLevelTypeId);
  }

  private async resolveParentId(
    current: FamilyId | null,
    next: number | null | undefined,
  ): Promise<Result<FamilyId | null, DomainError>> {
    if (next === undefined) {
      return ok(current);
    }

    if (next === null) {
      return ok(null);
    }

    const parentId = toFamilyId(next);
    const parent = await this.deps.familyRepository.findById(parentId);
    if (!parent) {
      return err(new FamilyNotFoundError(parentId));
    }

    return ok(parentId);
  }

  private async assertUniqueSibling(family: Family, excludeId: FamilyId) {
    const siblingNames = await this.deps.familyRepository.findSiblingNames(
      family.parentId,
      excludeId,
    );
    return assertUniqueSiblingName(family.name, siblingNames);
  }

  private async assertAcyclicParentForUpdate(family: Family) {
    if (family.parentId === null) {
      return ok(undefined);
    }

    const ancestorIds = await this.deps.familyRepository.getAncestorIds(
      family.parentId,
    );

    return assertAcyclicParent(family.id, family.parentId, ancestorIds);
  }
}
