import { MaterialPurpose } from "@/domain/classification/material-purpose";
import { getDb, closeDb } from "@/infrastructure/persistence/db";
import {
  bulkAssignTags,
  createLevelType,
  createMaterialNode,
  createSchema,
  createTag,
  listSchemas,
  replaceLevelMapsForSchema,
} from "@/infrastructure/persistence/repositories/classification/repository";

async function seedTaggedHvacTree(
  db: ReturnType<typeof getDb>,
  schemaId: number,
  levelTypeIds: {
    discipline: number;
    system: number;
    type: number;
    size: number;
  },
) {
  const hvacTag = await createTag(db, "hvac");
  const electricalTag = await createTag(db, "Electrical");
  const plumbingTag = await createTag(db, "Plumbing");
  const fireTag = await createTag(db, "fire");

  const hvac = await createMaterialNode(db, {
    schemaId,
    name: "HVAC",
    parentId: null,
    levelTypeId: levelTypeIds.discipline,
    purpose: MaterialPurpose.SystemOption,
  });
  await bulkAssignTags(db, [hvac.id], hvacTag.id);

  const airHandling = await createMaterialNode(db, {
    schemaId,
    name: "Air Handling Units",
    parentId: hvac.id,
    levelTypeId: levelTypeIds.system,
    purpose: MaterialPurpose.SystemOption,
  });

  const airOutlets = await createMaterialNode(db, {
    schemaId,
    name: "Air Outlets",
    parentId: hvac.id,
    levelTypeId: levelTypeIds.system,
    purpose: MaterialPurpose.SystemOption,
  });

  const chilledWater = await createMaterialNode(db, {
    schemaId,
    name: "Chilled Water Piping",
    parentId: hvac.id,
    levelTypeId: levelTypeIds.system,
    purpose: MaterialPurpose.SystemOption,
  });

  const ceilingDiffuser = await createMaterialNode(db, {
    schemaId,
    name: "Ceiling Diffuser",
    parentId: airOutlets.id,
    levelTypeId: levelTypeIds.type,
    purpose: MaterialPurpose.SystemOption,
  });
  await bulkAssignTags(db, [ceilingDiffuser.id], hvacTag.id);

  const computerRoom = await createMaterialNode(db, {
    schemaId,
    name: "Computer Room Unit",
    parentId: airHandling.id,
    levelTypeId: levelTypeIds.type,
    purpose: MaterialPurpose.SystemOption,
  });
  await bulkAssignTags(db, [computerRoom.id], hvacTag.id);

  const electrical = await createMaterialNode(db, {
    schemaId,
    name: "Electrical Distribution",
    parentId: null,
    levelTypeId: levelTypeIds.discipline,
    purpose: MaterialPurpose.SystemOption,
  });
  await bulkAssignTags(db, [electrical.id], electricalTag.id);

  const plumbing = await createMaterialNode(db, {
    schemaId,
    name: "Plumbing Systems",
    parentId: null,
    levelTypeId: levelTypeIds.discipline,
    purpose: MaterialPurpose.SystemOption,
  });
  await bulkAssignTags(db, [plumbing.id], plumbingTag.id);

  const fireProtection = await createMaterialNode(db, {
    schemaId,
    name: "Fire Protection",
    parentId: null,
    levelTypeId: levelTypeIds.discipline,
    purpose: MaterialPurpose.SystemOption,
  });
  await bulkAssignTags(db, [fireProtection.id], fireTag.id);

  return {
    hvac,
    airHandling,
    airOutlets,
    ceilingDiffuser,
    electrical,
    plumbing,
    fireProtection,
  };
}

async function main() {
  const db = getDb();
  const existing = await listSchemas(db);

  if (existing.length > 0) {
    console.log(`Seed skipped — ${existing.length} schema(s) already exist.`);
    await closeDb();
    return;
  }

  const schema = await createSchema(db, "Default MEP Families", "seed");
  const discipline = await createLevelType(db, {
    name: "Discipline",
    prefix: "D",
    isNumeric: false,
  });
  const system = await createLevelType(db, {
    name: "System",
    prefix: "S",
    isNumeric: false,
  });
  const type = await createLevelType(db, {
    name: "Type",
    prefix: "T",
    isNumeric: false,
  });
  const size = await createLevelType(db, {
    name: "Size",
    prefix: "",
    suffix: "MM",
    isNumeric: true,
  });

  await replaceLevelMapsForSchema(db, schema.id, [
    { levelTypeId: discipline.id, order: 1, isRequired: true },
    { levelTypeId: system.id, order: 2, isRequired: true },
    { levelTypeId: type.id, order: 3, isRequired: true },
    { levelTypeId: size.id, order: 4, isRequired: false },
  ]);

  await seedTaggedHvacTree(db, schema.id, {
    discipline: discipline.id,
    system: system.id,
    type: type.id,
    size: size.id,
  });

  await closeDb();
  console.log(`Seed complete. Schema id=${schema.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
