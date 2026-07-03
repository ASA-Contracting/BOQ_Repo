import { describe, expect, it } from "vitest";

import { mapFamiliesToTree } from "@/application/mappers/family/familyTreeMapper";
import { toFamilyId, toFamilyLevelTypeId } from "@/domain/family/ids";
import type { Family } from "@/domain/family/Family";
import {
  childFamily,
  rootFamily,
  tradeLevelType,
} from "@/application/use-cases/family/testHelpers";

describe("familyTreeMapper", () => {
  it("builds a nested tree ordered by name", () => {
    const sibling: Family = {
      id: toFamilyId(12),
      name: "Electrical",
      referenceCode: null,
      description: null,
      familyLevelTypeId: tradeLevelType.id,
      parentId: rootFamily.id,
    };

    const tree = mapFamiliesToTree([rootFamily, childFamily, sibling]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children.map((node) => node.name)).toEqual([
      "Electrical",
      "HVAC",
    ]);
  });

  it("promotes orphaned nodes to roots", () => {
    const orphan: Family = {
      id: toFamilyId(13),
      name: "Orphan",
      referenceCode: null,
      description: null,
      familyLevelTypeId: toFamilyLevelTypeId(1),
      parentId: toFamilyId(999),
    };

    const tree = mapFamiliesToTree([orphan]);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.name).toBe("Orphan");
  });
});
