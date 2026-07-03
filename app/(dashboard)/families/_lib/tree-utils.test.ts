import { describe, expect, it } from "vitest";

import type { FamilyTreeNodeDto } from "@/application/dto/family/familyDto";
import {
  buildParentOptions,
  collectAllNodeIds,
  findPathToNode,
  flattenVisibleNodes,
  mapTreeDto,
  splitHighlightText,
} from "@/app/(dashboard)/families/_lib/tree-utils";

const sampleTree: FamilyTreeNodeDto[] = [
  {
    id: 1,
    name: "Mechanical",
    referenceCode: null,
    familyLevelTypeId: 1,
    parentId: null,
    children: [
      {
        id: 2,
        name: "HVAC",
        referenceCode: "HVAC-01",
        familyLevelTypeId: 1,
        parentId: 1,
        children: [
          {
            id: 3,
            name: "Duct",
            referenceCode: null,
            familyLevelTypeId: 1,
            parentId: 2,
            children: [],
          },
        ],
      },
    ],
  },
];

describe("tree-utils", () => {
  it("maps dto trees and collects ids", () => {
    const tree = mapTreeDto(sampleTree);
    expect(collectAllNodeIds(tree)).toEqual([1, 2, 3]);
  });

  it("flattens only expanded nodes", () => {
    const tree = mapTreeDto(sampleTree);
    expect(flattenVisibleNodes(tree, new Set([1])).map((node) => node.id)).toEqual(
      [1, 2],
    );
    expect(
      flattenVisibleNodes(tree, new Set([1, 2])).map((node) => node.id),
    ).toEqual([1, 2, 3]);
  });

  it("finds a path to a nested node", () => {
    const tree = mapTreeDto(sampleTree);
    expect(findPathToNode(tree, 3)).toEqual([1, 2, 3]);
  });

  it("builds parent options excluding the edited node", () => {
    const tree = mapTreeDto(sampleTree);
    expect(buildParentOptions(tree, 2)).toEqual([
      { id: 1, label: "Mechanical" },
      { id: 3, label: "    Duct" },
    ]);
  });

  it("splits highlight segments case-insensitively", () => {
    expect(splitHighlightText("HVAC Systems", "hvac")).toEqual([
      { text: "HVAC", match: true },
      { text: " Systems", match: false },
    ]);
  });
});
