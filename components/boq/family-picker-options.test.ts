import { describe, expect, it } from "vitest";

import {
  buildFamilyPickerOptions,
  familyOptionForItem,
  normalizeFamilyId,
} from "./family-picker-options";

describe("family-picker-options", () => {
  it("normalizes family ids for select matching", () => {
    expect(normalizeFamilyId(5)).toBe(5);
    expect(normalizeFamilyId("7" as unknown as number)).toBe(7);
    expect(normalizeFamilyId(null)).toBeNull();
  });

  it("builds hierarchical labels for picker options", () => {
    const options = buildFamilyPickerOptions([
      {
        id: 1,
        name: "Mechanical",
        referenceCode: "M",
        familyLevelTypeId: 1,
        parentId: null,
        children: [
          {
            id: 2,
            name: "HVAC",
            referenceCode: null,
            familyLevelTypeId: 2,
            parentId: 1,
            children: [],
          },
        ],
      },
    ]);

    expect(options).toHaveLength(2);
    expect(options[1]?.label).toBe("Mechanical › HVAC");
  });

  it("falls back to family label when id is missing", () => {
    const option = familyOptionForItem([], {
      familyId: null,
      familyLabel: "Legacy family",
      familyPath: null,
    });

    expect(option?.name).toBe("Legacy family");
  });
});
