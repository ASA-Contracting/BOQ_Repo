import type { FamilyReferenceCounts } from "@/domain/family/FamilyReferenceCounts";
import { hasNonChildFamilyReferences } from "@/domain/family/FamilyReferenceCounts";
import {
  FAMILY_DESCRIPTION_MAX_LENGTH,
  FAMILY_NAME_MAX_LENGTH,
  FAMILY_REFERENCE_CODE_MAX_LENGTH,
} from "@/domain/family/constants";
import {
  CircularParentError,
  DuplicateSiblingNameError,
  FamilyHasChildrenError,
  FamilyReferencedError,
} from "@/domain/family/errors/FamilyErrors";
import type { FamilyId } from "@/domain/family/ids";
import { err, ok, type Result } from "@/domain/shared/Result";
import { ValidationError } from "@/domain/shared/errors/ValidationError";

export function normalizeSiblingName(name: string): string {
  return name.trim().toLowerCase();
}

export function validateName(name: string): Result<string, ValidationError> {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return err(
      new ValidationError("Family name is required.", { field: "name" }),
    );
  }

  if (trimmed.length > FAMILY_NAME_MAX_LENGTH) {
    return err(
      new ValidationError(
        `Family name must not exceed ${FAMILY_NAME_MAX_LENGTH} characters.`,
        { field: "name", maxLength: FAMILY_NAME_MAX_LENGTH },
      ),
    );
  }

  return ok(trimmed);
}

export function validateReferenceCode(
  referenceCode: string | null,
): Result<string | null, ValidationError> {
  if (referenceCode === null) {
    return ok(null);
  }

  const trimmed = referenceCode.trim();

  if (trimmed.length === 0) {
    return ok(null);
  }

  if (trimmed.length > FAMILY_REFERENCE_CODE_MAX_LENGTH) {
    return err(
      new ValidationError(
        `Reference code must not exceed ${FAMILY_REFERENCE_CODE_MAX_LENGTH} characters.`,
        {
          field: "referenceCode",
          maxLength: FAMILY_REFERENCE_CODE_MAX_LENGTH,
        },
      ),
    );
  }

  return ok(trimmed);
}

export function validateDescription(
  description: string | null,
): Result<string | null, ValidationError> {
  if (description === null) {
    return ok(null);
  }

  const trimmed = description.trim();

  if (trimmed.length === 0) {
    return ok(null);
  }

  if (trimmed.length > FAMILY_DESCRIPTION_MAX_LENGTH) {
    return err(
      new ValidationError(
        `Description must not exceed ${FAMILY_DESCRIPTION_MAX_LENGTH} characters.`,
        {
          field: "description",
          maxLength: FAMILY_DESCRIPTION_MAX_LENGTH,
        },
      ),
    );
  }

  return ok(trimmed);
}

export function assertUniqueSiblingName(
  name: string,
  siblingNames: readonly string[],
): Result<void, DuplicateSiblingNameError> {
  const normalizedName = normalizeSiblingName(name);

  const hasDuplicate = siblingNames.some(
    (siblingName) => normalizeSiblingName(siblingName) === normalizedName,
  );

  if (hasDuplicate) {
    return err(new DuplicateSiblingNameError(name));
  }

  return ok(undefined);
}

export function assertAcyclicParent(
  familyId: FamilyId,
  proposedParentId: FamilyId | null,
  proposedParentAncestorIds: readonly FamilyId[],
): Result<void, CircularParentError> {
  if (proposedParentId === null) {
    return ok(undefined);
  }

  if (proposedParentId === familyId) {
    return err(new CircularParentError(familyId, proposedParentId));
  }

  if (proposedParentAncestorIds.includes(familyId)) {
    return err(new CircularParentError(familyId, proposedParentId));
  }

  return ok(undefined);
}

export function canDelete(
  familyId: FamilyId,
  referenceCounts: FamilyReferenceCounts,
): Result<void, FamilyHasChildrenError | FamilyReferencedError> {
  if (referenceCounts.childCount > 0) {
    return err(new FamilyHasChildrenError(familyId));
  }

  if (hasNonChildFamilyReferences(referenceCounts)) {
    return err(new FamilyReferencedError(familyId));
  }

  return ok(undefined);
}
