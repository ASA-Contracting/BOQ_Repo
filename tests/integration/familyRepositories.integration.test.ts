import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { familyLevelTypes } from "@/drizzle/schema";
import type { FamilyId } from "@/domain/family/ids";
import { toFamilyLevelTypeId } from "@/domain/family/ids";
import { totalFamilyReferences } from "@/domain/family/FamilyReferenceCounts";
import { DrizzleFamilyLevelTypeRepository } from "@/infrastructure/persistence/family/DrizzleFamilyLevelTypeRepository";
import { DrizzleFamilyRepository } from "@/infrastructure/persistence/family/DrizzleFamilyRepository";
import {
  checkDbConnection,
  closeDb,
  getDb,
  resetDbForTests,
} from "@/infrastructure/persistence/db";

let databaseAvailable = false;
let levelTypeId = toFamilyLevelTypeId(0);
const createdFamilyIds: FamilyId[] = [];

const familyRepository = new DrizzleFamilyRepository();
const familyLevelTypeRepository = new DrizzleFamilyLevelTypeRepository();

function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureFamilyLevelTypeId() {
  const existing = await familyLevelTypeRepository.findAll();
  if (existing.length > 0) {
    levelTypeId = existing[0].id;
    return;
  }

  const [row] = await getDb()
    .insert(familyLevelTypes)
    .values({ Name: uniqueName("LevelType") })
    .returning();

  if (!row) {
    throw new Error("Failed to seed FamilyLevelTypes test row.");
  }

  levelTypeId = toFamilyLevelTypeId(row.Id);
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    databaseAvailable = false;
    return;
  }

  databaseAvailable = await checkDbConnection();
  if (!databaseAvailable) {
    return;
  }

  await ensureFamilyLevelTypeId();
});

afterEach(async () => {
  while (createdFamilyIds.length > 0) {
    const familyId = createdFamilyIds.pop();
    if (familyId !== undefined) {
      await familyRepository.delete(familyId);
    }
  }
});

afterAll(async () => {
  await closeDb();
  resetDbForTests();
});

describe("Drizzle family repositories", () => {
  it.skipIf(!databaseAvailable)("creates, reads, updates, and deletes families", async () => {
    const created = await familyRepository.create({
      name: uniqueName("Root"),
      referenceCode: "REF-001",
      description: "Root family",
      familyLevelTypeId: levelTypeId,
      parentId: null,
    });
    createdFamilyIds.push(created.id);

    const loaded = await familyRepository.findById(created.id);
    expect(loaded).toEqual(created);

    const updated = await familyRepository.update({
      ...created,
      name: uniqueName("RootUpdated"),
      description: "Updated description",
    });
    expect(updated.name).toContain("RootUpdated");
    expect(updated.description).toBe("Updated description");

    await familyRepository.delete(updated.id);
    createdFamilyIds.pop();

    await expect(familyRepository.findById(updated.id)).resolves.toBeNull();
  });

  it.skipIf(!databaseAvailable)("finds children and sibling names under a parent", async () => {
    const parent = await familyRepository.create({
      name: uniqueName("Parent"),
      referenceCode: null,
      description: null,
      familyLevelTypeId: levelTypeId,
      parentId: null,
    });
    createdFamilyIds.push(parent.id);

    const childA = await familyRepository.create({
      name: uniqueName("ChildA"),
      referenceCode: null,
      description: null,
      familyLevelTypeId: levelTypeId,
      parentId: parent.id,
    });
    createdFamilyIds.push(childA.id);

    const childB = await familyRepository.create({
      name: uniqueName("ChildB"),
      referenceCode: null,
      description: null,
      familyLevelTypeId: levelTypeId,
      parentId: parent.id,
    });
    createdFamilyIds.push(childB.id);

    const children = await familyRepository.findChildren(parent.id);
    expect(children.map((family) => family.id).sort()).toEqual(
      [childA.id, childB.id].sort(),
    );

    const siblingNames = await familyRepository.findSiblingNames(parent.id);
    expect(siblingNames).toContain(childA.name);
    expect(siblingNames).toContain(childB.name);
  });

  it.skipIf(!databaseAvailable)("searches families by name", async () => {
    const searchableName = uniqueName("SearchableFamily");
    const created = await familyRepository.create({
      name: searchableName,
      referenceCode: "SEARCH-REF",
      description: "Searchable description",
      familyLevelTypeId: levelTypeId,
      parentId: null,
    });
    createdFamilyIds.push(created.id);

    const results = await familyRepository.search("SearchableFamily", 10);
    expect(results.some((family) => family.id === created.id)).toBe(true);
  });

  it.skipIf(!databaseAvailable)("returns ancestor ids for nested families", async () => {
    const root = await familyRepository.create({
      name: uniqueName("AncestorRoot"),
      referenceCode: null,
      description: null,
      familyLevelTypeId: levelTypeId,
      parentId: null,
    });
    createdFamilyIds.push(root.id);

    const middle = await familyRepository.create({
      name: uniqueName("AncestorMiddle"),
      referenceCode: null,
      description: null,
      familyLevelTypeId: levelTypeId,
      parentId: root.id,
    });
    createdFamilyIds.push(middle.id);

    const leaf = await familyRepository.create({
      name: uniqueName("AncestorLeaf"),
      referenceCode: null,
      description: null,
      familyLevelTypeId: levelTypeId,
      parentId: middle.id,
    });
    createdFamilyIds.push(leaf.id);

    const ancestors = await familyRepository.getAncestorIds(leaf.id);
    expect(ancestors).toEqual(expect.arrayContaining([middle.id, root.id]));
    expect(ancestors).toHaveLength(2);
  });

  it.skipIf(!databaseAvailable)("returns reference counts including child families", async () => {
    const parent = await familyRepository.create({
      name: uniqueName("RefParent"),
      referenceCode: null,
      description: null,
      familyLevelTypeId: levelTypeId,
      parentId: null,
    });
    createdFamilyIds.push(parent.id);

    const child = await familyRepository.create({
      name: uniqueName("RefChild"),
      referenceCode: null,
      description: null,
      familyLevelTypeId: levelTypeId,
      parentId: parent.id,
    });
    createdFamilyIds.push(child.id);

    const counts = await familyRepository.getReferenceCounts(parent.id);
    expect(counts.childCount).toBe(1);
    expect(totalFamilyReferences(counts)).toBeGreaterThanOrEqual(1);
  });

  it.skipIf(!databaseAvailable)("reads family level types", async () => {
    const levelTypes = await familyLevelTypeRepository.findAll();
    expect(levelTypes.length).toBeGreaterThan(0);

    const loaded = await familyLevelTypeRepository.findById(levelTypeId);
    expect(loaded?.id).toBe(levelTypeId);
  });

  it("documents when live database integration is unavailable", () => {
    if (databaseAvailable) {
      expect(process.env.DATABASE_URL).toBeTruthy();
      return;
    }

    expect(databaseAvailable).toBe(false);
  });
});
