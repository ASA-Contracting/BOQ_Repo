export type { Family, NewFamily } from "@/domain/family/Family";
export type { FamilyLevelType } from "@/domain/family/FamilyLevelType";
export type {
  FamilyReferenceCounts,
} from "@/domain/family/FamilyReferenceCounts";
export {
  hasFamilyReferences,
  hasNonChildFamilyReferences,
  totalFamilyReferences,
} from "@/domain/family/FamilyReferenceCounts";
export {
  FAMILY_DESCRIPTION_MAX_LENGTH,
  FAMILY_LEVEL_TYPE_NAME_MAX_LENGTH,
  FAMILY_NAME_MAX_LENGTH,
  FAMILY_REFERENCE_CODE_MAX_LENGTH,
} from "@/domain/family/constants";
export {
  CircularParentError,
  DuplicateSiblingNameError,
  FamilyHasChildrenError,
  FamilyLevelTypeNotFoundError,
  FamilyNotFoundError,
  FamilyReferencedError,
} from "@/domain/family/errors/FamilyErrors";
export {
  assertAcyclicParent,
  assertUniqueSiblingName,
  canDelete,
  normalizeSiblingName,
  validateDescription,
  validateName,
  validateReferenceCode,
} from "@/domain/family/familyValidators";
export type { FamilyId, FamilyLevelTypeId } from "@/domain/family/ids";
export {
  toFamilyId,
  toFamilyLevelTypeId,
} from "@/domain/family/ids";
export type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
export type { IFamilyLevelTypeRepository } from "@/domain/family/repositories/IFamilyLevelTypeRepository";
