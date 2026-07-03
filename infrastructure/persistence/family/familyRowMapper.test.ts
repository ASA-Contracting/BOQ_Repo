import { describe, expect, it } from "vitest";

import {
  mapFamilyLevelTypeRowToDomain,
  mapFamilyRowToDomain,
  mapFamilyToUpdateRow,
  mapNewFamilyToInsertRow,
} from "@/infrastructure/persistence/family/familyRowMapper";
import { toFamilyId, toFamilyLevelTypeId } from "@/domain/family/ids";

describe("familyRowMapper", () => {
  it("maps family rows to domain entities", () => {
    const family = mapFamilyRowToDomain({
      Id: 10,
      Name: "HVAC",
      ReferenceCode: "HVAC-01",
      Description: "Heating and ventilation",
      FamilyLevelTypeId: 2,
      ParentId: 1,
    });

    expect(family).toEqual({
      id: toFamilyId(10),
      name: "HVAC",
      referenceCode: "HVAC-01",
      description: "Heating and ventilation",
      familyLevelTypeId: toFamilyLevelTypeId(2),
      parentId: toFamilyId(1),
    });
  });

  it("maps null parent and nullable text fields", () => {
    const family = mapFamilyRowToDomain({
      Id: 3,
      Name: "Root",
      ReferenceCode: null,
      Description: null,
      FamilyLevelTypeId: 1,
      ParentId: null,
    });

    expect(family.parentId).toBeNull();
    expect(family.referenceCode).toBeNull();
    expect(family.description).toBeNull();
  });

  it("maps family level type rows to domain entities", () => {
    const levelType = mapFamilyLevelTypeRowToDomain({
      Id: 5,
      Name: "Trade",
    });

    expect(levelType).toEqual({
      id: toFamilyLevelTypeId(5),
      name: "Trade",
    });
  });

  it("maps new families to insert rows", () => {
    const insertRow = mapNewFamilyToInsertRow({
      name: "Plumbing",
      referenceCode: "PL-01",
      description: "Plumbing systems",
      familyLevelTypeId: toFamilyLevelTypeId(1),
      parentId: toFamilyId(2),
    });

    expect(insertRow).toEqual({
      Name: "Plumbing",
      ReferenceCode: "PL-01",
      Description: "Plumbing systems",
      FamilyLevelTypeId: 1,
      ParentId: 2,
    });
  });

  it("maps families to update rows without primary key", () => {
    const updateRow = mapFamilyToUpdateRow({
      id: toFamilyId(7),
      name: "Updated",
      referenceCode: null,
      description: "Updated description",
      familyLevelTypeId: toFamilyLevelTypeId(1),
      parentId: null,
    });

    expect(updateRow).toEqual({
      Name: "Updated",
      ReferenceCode: null,
      Description: "Updated description",
      FamilyLevelTypeId: 1,
      ParentId: null,
    });
    expect("Id" in updateRow).toBe(false);
  });
});
