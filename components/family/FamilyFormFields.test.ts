import { describe, expect, it } from "vitest";

import {
  createEmptyFamilyFormValues,
  familyDetailToFormValues,
} from "@/components/family/FamilyFormFields";

describe("FamilyFormFields helpers", () => {
  it("creates empty form values with defaults", () => {
    expect(
      createEmptyFamilyFormValues({ parentId: "10", familyLevelTypeId: "2" }),
    ).toEqual({
      name: "",
      referenceCode: "",
      description: "",
      familyLevelTypeId: "2",
      parentId: "10",
    });
  });

  it("maps family detail DTOs to form values", () => {
    expect(
      familyDetailToFormValues({
        name: "HVAC",
        referenceCode: "HVAC-01",
        description: null,
        familyLevelTypeId: 3,
        parentId: 10,
      }),
    ).toEqual({
      name: "HVAC",
      referenceCode: "HVAC-01",
      description: "",
      familyLevelTypeId: "3",
      parentId: "10",
    });
  });
});
