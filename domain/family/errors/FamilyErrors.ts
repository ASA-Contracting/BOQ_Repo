import { DomainError } from "@/domain/shared/errors/DomainError";

import type { FamilyId } from "@/domain/family/ids";
import type { FamilyLevelTypeId } from "@/domain/family/ids";

export class FamilyNotFoundError extends DomainError {
  readonly code = "FAMILY_NOT_FOUND";

  constructor(readonly familyId: FamilyId) {
    super(`Family not found: ${familyId}`);
  }
}

export class FamilyLevelTypeNotFoundError extends DomainError {
  readonly code = "FAMILY_LEVEL_TYPE_NOT_FOUND";

  constructor(readonly familyLevelTypeId: FamilyLevelTypeId) {
    super(`Family level type not found: ${familyLevelTypeId}`);
  }
}

export class CircularParentError extends DomainError {
  readonly code = "CIRCULAR_PARENT";

  constructor(readonly familyId: FamilyId, readonly parentId: FamilyId) {
    super(
      `Assigning parent ${parentId} to family ${familyId} would create a circular hierarchy.`,
    );
  }
}

export class DuplicateSiblingNameError extends DomainError {
  readonly code = "DUPLICATE_SIBLING_NAME";

  constructor(readonly name: string) {
    super(`A sibling family with name "${name.trim()}" already exists.`);
  }
}

export class FamilyHasChildrenError extends DomainError {
  readonly code = "FAMILY_HAS_CHILDREN";

  constructor(readonly familyId?: FamilyId) {
    super(
      familyId
        ? `Family ${familyId} cannot be deleted because it has child families.`
        : "Family cannot be deleted because it has child families.",
    );
  }
}

export class FamilyReferencedError extends DomainError {
  readonly code = "FAMILY_REFERENCED";

  constructor(readonly familyId?: FamilyId) {
    super(
      familyId
        ? `Family ${familyId} cannot be deleted because it is referenced by production or workshop data.`
        : "Family cannot be deleted because it is referenced by production or workshop data.",
    );
  }
}
