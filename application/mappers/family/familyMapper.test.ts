import { describe, expect, it } from "vitest";

import {
  mapFamilyLevelTypeToDto,
  mapFamilyToDetailDto,
  mapFamilyToListItemDto,
} from "@/application/mappers/family/familyMapper";
import {
  childFamily,
  rootFamily,
  tradeLevelType,
} from "@/application/use-cases/family/testHelpers";

describe("familyMapper", () => {
  it("maps families to list item DTOs", () => {
    expect(mapFamilyToListItemDto(childFamily)).toEqual({
      id: childFamily.id as number,
      name: "HVAC",
      referenceCode: null,
      description: null,
      familyLevelTypeId: tradeLevelType.id as number,
      parentId: rootFamily.id as number,
    });
  });

  it("maps families to detail DTOs with parent summary", () => {
    expect(
      mapFamilyToDetailDto(childFamily, "Trade", rootFamily),
    ).toEqual({
      id: childFamily.id as number,
      name: "HVAC",
      referenceCode: null,
      description: null,
      familyLevelTypeId: tradeLevelType.id as number,
      familyLevelTypeName: "Trade",
      parentId: rootFamily.id as number,
      parent: {
        id: rootFamily.id as number,
        name: "Mechanical",
      },
    });
  });

  it("maps level types to DTOs", () => {
    expect(mapFamilyLevelTypeToDto(tradeLevelType)).toEqual({
      id: tradeLevelType.id as number,
      name: "Trade",
    });
  });
});
