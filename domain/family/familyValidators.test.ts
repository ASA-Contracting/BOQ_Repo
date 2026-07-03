import { describe, expect, it } from "vitest";

import {
  FAMILY_DESCRIPTION_MAX_LENGTH,
  FAMILY_NAME_MAX_LENGTH,
  FAMILY_REFERENCE_CODE_MAX_LENGTH,
} from "@/domain/family/constants";
import {
  CircularParentError,
  DuplicateSiblingNameError,
  FamilyHasChildrenError,
  FamilyLevelTypeNotFoundError,
  FamilyNotFoundError,
  FamilyReferencedError,
} from "@/domain/family/errors/FamilyErrors";
import {
  assertAcyclicParent,
  assertUniqueSiblingName,
  canDelete,
  normalizeSiblingName,
  validateDescription,
  validateName,
  validateReferenceCode,
} from "@/domain/family/familyValidators";
import type { FamilyReferenceCounts } from "@/domain/family/FamilyReferenceCounts";
import { toFamilyId, toFamilyLevelTypeId } from "@/domain/family/ids";
import { ValidationError } from "@/domain/shared/errors/ValidationError";

const familyId = toFamilyId(10);
const parentId = toFamilyId(20);
const grandparentId = toFamilyId(30);

function emptyReferenceCounts(): FamilyReferenceCounts {
  return {
    childCount: 0,
    boqItemCount: 0,
    workshopItemOriginalCount: 0,
    workshopItemLatestSuggestedCount: 0,
    workshopItemFinalCount: 0,
    workshopItemProductionCheckCount: 0,
    workshopAiSuggestionCount: 0,
    workshopReviewPreviousCount: 0,
    workshopReviewSelectedCount: 0,
    workshopExportOldCount: 0,
    workshopExportNewCount: 0,
  };
}

describe("validateName", () => {
  it("accepts a valid trimmed name", () => {
    const result = validateName("  HVAC Systems  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("HVAC Systems");
    }
  });

  it("accepts a name at the maximum length boundary", () => {
    const name = "A".repeat(FAMILY_NAME_MAX_LENGTH);
    const result = validateName(name);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(FAMILY_NAME_MAX_LENGTH);
    }
  });

  it("rejects an empty name", () => {
    const result = validateName("   ");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.details).toEqual({ field: "name" });
    }
  });

  it("rejects a name exceeding the maximum length", () => {
    const result = validateName("A".repeat(FAMILY_NAME_MAX_LENGTH + 1));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.details).toEqual({
        field: "name",
        maxLength: FAMILY_NAME_MAX_LENGTH,
      });
    }
  });
});

describe("validateReferenceCode", () => {
  it("accepts null and blank values as null", () => {
    const nullResult = validateReferenceCode(null);
    expect(nullResult.ok).toBe(true);
    if (nullResult.ok) {
      expect(nullResult.value).toBeNull();
    }

    const blankResult = validateReferenceCode("   ");
    expect(blankResult.ok).toBe(true);
    if (blankResult.ok) {
      expect(blankResult.value).toBeNull();
    }
  });

  it("trims a valid reference code", () => {
    const result = validateReferenceCode("  REF-001  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("REF-001");
    }
  });

  it("rejects a reference code exceeding the maximum length", () => {
    const result = validateReferenceCode(
      "R".repeat(FAMILY_REFERENCE_CODE_MAX_LENGTH + 1),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details).toEqual({
        field: "referenceCode",
        maxLength: FAMILY_REFERENCE_CODE_MAX_LENGTH,
      });
    }
  });

  it("accepts a reference code at the maximum length boundary", () => {
    const result = validateReferenceCode(
      "R".repeat(FAMILY_REFERENCE_CODE_MAX_LENGTH),
    );

    expect(result.ok).toBe(true);
  });
});

describe("validateDescription", () => {
  it("accepts null and blank values as null", () => {
    const nullResult = validateDescription(null);
    expect(nullResult.ok).toBe(true);
    if (nullResult.ok) {
      expect(nullResult.value).toBeNull();
    }

    const blankResult = validateDescription("  ");
    expect(blankResult.ok).toBe(true);
    if (blankResult.ok) {
      expect(blankResult.value).toBeNull();
    }
  });

  it("trims a valid description", () => {
    const result = validateDescription("  Mechanical scope  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Mechanical scope");
    }
  });

  it("rejects a description exceeding the maximum length", () => {
    const result = validateDescription(
      "D".repeat(FAMILY_DESCRIPTION_MAX_LENGTH + 1),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details).toEqual({
        field: "description",
        maxLength: FAMILY_DESCRIPTION_MAX_LENGTH,
      });
    }
  });

  it("accepts a description at the maximum length boundary", () => {
    const result = validateDescription(
      "D".repeat(FAMILY_DESCRIPTION_MAX_LENGTH),
    );

    expect(result.ok).toBe(true);
  });
});

describe("assertUniqueSiblingName", () => {
  it("allows a unique sibling name", () => {
    const result = assertUniqueSiblingName("Plumbing", ["HVAC", "Electrical"]);

    expect(result.ok).toBe(true);
  });

  it("detects duplicate sibling names case-insensitively after trim", () => {
    const result = assertUniqueSiblingName("  hvac ", ["Mechanical", "HVAC"]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(DuplicateSiblingNameError);
      expect(result.error.code).toBe("DUPLICATE_SIBLING_NAME");
    }
  });

  it("allows the same normalized name when sibling list excludes the current family", () => {
    const result = assertUniqueSiblingName("HVAC", []);

    expect(result.ok).toBe(true);
  });
});

describe("normalizeSiblingName", () => {
  it("normalizes names for sibling comparison", () => {
    expect(normalizeSiblingName("  HVAC ")).toBe("hvac");
  });
});

describe("assertAcyclicParent", () => {
  it("allows a null parent", () => {
    const result = assertAcyclicParent(familyId, null, [grandparentId]);

    expect(result.ok).toBe(true);
  });

  it("rejects self-parenting", () => {
    const result = assertAcyclicParent(familyId, familyId, []);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(CircularParentError);
      expect(result.error.code).toBe("CIRCULAR_PARENT");
      expect(result.error.familyId).toBe(familyId);
      expect(result.error.parentId).toBe(familyId);
    }
  });

  it("rejects assigning a descendant as parent", () => {
    const result = assertAcyclicParent(familyId, parentId, [
      grandparentId,
      familyId,
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(CircularParentError);
    }
  });

  it("allows a valid parent with no cycle", () => {
    const result = assertAcyclicParent(familyId, parentId, [grandparentId]);

    expect(result.ok).toBe(true);
  });
});

describe("canDelete", () => {
  it("allows delete when there are no children or references", () => {
    const result = canDelete(familyId, emptyReferenceCounts());

    expect(result.ok).toBe(true);
  });

  it("blocks delete when child families exist", () => {
    const result = canDelete(familyId, {
      ...emptyReferenceCounts(),
      childCount: 2,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FamilyHasChildrenError);
      expect(result.error.code).toBe("FAMILY_HAS_CHILDREN");
      expect(result.error.familyId).toBe(familyId);
    }
  });

  it("blocks delete when production or workshop references exist", () => {
    const result = canDelete(familyId, {
      ...emptyReferenceCounts(),
      boqItemCount: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FamilyReferencedError);
      expect(result.error.code).toBe("FAMILY_REFERENCED");
    }
  });

  it("prefers the children error when both children and references exist", () => {
    const result = canDelete(familyId, {
      ...emptyReferenceCounts(),
      childCount: 1,
      boqItemCount: 5,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FamilyHasChildrenError);
    }
  });

  it("blocks delete for each workshop reference source", () => {
    const referenceFields: Array<keyof FamilyReferenceCounts> = [
      "workshopItemOriginalCount",
      "workshopItemLatestSuggestedCount",
      "workshopItemFinalCount",
      "workshopItemProductionCheckCount",
      "workshopAiSuggestionCount",
      "workshopReviewPreviousCount",
      "workshopReviewSelectedCount",
      "workshopExportOldCount",
      "workshopExportNewCount",
    ];

    for (const field of referenceFields) {
      const counts = emptyReferenceCounts();
      counts[field] = 1;

      const result = canDelete(familyId, counts);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(FamilyReferencedError);
      }
    }
  });
});

describe("valid family field validation for creation", () => {
  it("accepts a fully valid new family field set", () => {
    const nameResult = validateName("Mechanical");
    const referenceCodeResult = validateReferenceCode("MECH-01");
    const descriptionResult = validateDescription("Mechanical systems");

    expect(nameResult.ok).toBe(true);
    expect(referenceCodeResult.ok).toBe(true);
    expect(descriptionResult.ok).toBe(true);
  });
});

describe("family domain errors", () => {
  it("exposes stable error codes", () => {
    expect(new FamilyNotFoundError(familyId).code).toBe("FAMILY_NOT_FOUND");
    expect(new FamilyLevelTypeNotFoundError(toFamilyLevelTypeId(1)).code).toBe(
      "FAMILY_LEVEL_TYPE_NOT_FOUND",
    );
    expect(new CircularParentError(familyId, parentId).code).toBe(
      "CIRCULAR_PARENT",
    );
    expect(new DuplicateSiblingNameError("HVAC").code).toBe(
      "DUPLICATE_SIBLING_NAME",
    );
    expect(new FamilyHasChildrenError(familyId).code).toBe(
      "FAMILY_HAS_CHILDREN",
    );
    expect(new FamilyReferencedError(familyId).code).toBe("FAMILY_REFERENCED");
  });
});
