import { describe, expect, it } from "vitest";

import { createFamilySchema } from "@/application/dto/family/createFamilySchema";
import { searchFamiliesSchema } from "@/application/dto/family/searchFamiliesSchema";
import { updateFamilySchema } from "@/application/dto/family/updateFamilySchema";
import { FAMILY_NAME_MAX_LENGTH } from "@/domain/family/constants";

describe("family Zod schemas", () => {
  it("parses valid create input", () => {
    const parsed = createFamilySchema.parse({
      name: "Mechanical",
      referenceCode: "MECH",
      description: "Mechanical scope",
      familyLevelTypeId: 1,
      parentId: null,
    });

    expect(parsed.name).toBe("Mechanical");
    expect(parsed.parentId).toBeNull();
  });

  it("allows omitted optional create fields", () => {
    const parsed = createFamilySchema.parse({
      name: "Mechanical",
      familyLevelTypeId: 1,
    });

    expect(parsed.referenceCode).toBeUndefined();
    expect(parsed.description).toBeUndefined();
  });

  it("rejects invalid create input", () => {
    expect(() =>
      createFamilySchema.parse({
        name: "",
        familyLevelTypeId: 1,
      }),
    ).toThrow();
  });

  it("parses partial update input", () => {
    const parsed = updateFamilySchema.parse({
      id: 10,
      name: "Updated",
    });

    expect(parsed.id).toBe(10);
    expect(parsed.name).toBe("Updated");
  });

  it("applies default search limit", () => {
    const parsed = searchFamiliesSchema.parse({ query: "HVAC" });
    expect(parsed.limit).toBe(20);
  });

  it("enforces search query bounds", () => {
    expect(() => searchFamiliesSchema.parse({ query: "   " })).toThrow();
    expect(() =>
      searchFamiliesSchema.parse({ query: "x".repeat(101), limit: 20 }),
    ).toThrow();
  });

  it("enforces create name max length at the boundary", () => {
    const parsed = createFamilySchema.parse({
      name: "A".repeat(FAMILY_NAME_MAX_LENGTH),
      familyLevelTypeId: 1,
    });

    expect(parsed.name).toHaveLength(FAMILY_NAME_MAX_LENGTH);
  });
});
