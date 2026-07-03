import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import type { Db } from '@/infrastructure/persistence/db';
import {
  classificationSchemas,
  levelMaps,
  levelTypes,
  materialItems,
  materialNodes,
  materialSheets,
  materialTags,
  tags,
} from '@/infrastructure/persistence/schema';

export async function listSchemas(db: Db) {
  return db.select().from(classificationSchemas).orderBy(asc(classificationSchemas.name));
}

export async function createSchema(db: Db, name: string, createdBy?: string) {
  const [row] = await db
    .insert(classificationSchemas)
    .values({ name, createdBy })
    .returning();
  return row;
}

export async function findSchemaById(db: Db, id: number) {
  const [row] = await db
    .select()
    .from(classificationSchemas)
    .where(eq(classificationSchemas.id, id));
  return row ?? null;
}

export async function listLevelTypes(db: Db) {
  return db.select().from(levelTypes).orderBy(asc(levelTypes.name), asc(levelTypes.id));
}

export async function findLevelTypeById(db: Db, id: number) {
  const [row] = await db.select().from(levelTypes).where(eq(levelTypes.id, id));
  return row ?? null;
}

export async function createLevelType(
  db: Db,
  data: {
    name: string;
    prefix?: string;
    suffix?: string;
    isNumeric?: boolean;
    standardUnitId?: number | null;
  }
) {
  const [row] = await db.insert(levelTypes).values(data).returning();
  return row;
}

export async function updateLevelType(
  db: Db,
  id: number,
  data: Partial<{
    name: string;
    prefix: string | null;
    suffix: string | null;
    isNumeric: boolean;
    standardUnitId: number | null;
    isActive: boolean;
  }>
) {
  const [row] = await db
    .update(levelTypes)
    .set(data)
    .where(eq(levelTypes.id, id))
    .returning();
  return row ?? null;
}

export async function deleteLevelType(db: Db, id: number) {
  await db.delete(levelTypes).where(eq(levelTypes.id, id));
}

export async function findLevelMapsBySchemaId(db: Db, schemaId: number) {
  return db
    .select({
      id: levelMaps.id,
      levelOrder: levelMaps.levelOrder,
      levelTypeId: levelMaps.levelTypeId,
      levelTypeName: levelTypes.name,
      schemaId: levelMaps.schemaId,
      isRequired: levelMaps.isRequired,
    })
    .from(levelMaps)
    .innerJoin(levelTypes, eq(levelMaps.levelTypeId, levelTypes.id))
    .where(eq(levelMaps.schemaId, schemaId))
    .orderBy(asc(levelMaps.levelOrder), asc(levelMaps.id));
}

export async function replaceLevelMapsForSchema(
  db: Db,
  schemaId: number,
  levels: Array<{ levelTypeId: number; order: number; isRequired: boolean }>
) {
  await db.delete(levelMaps).where(eq(levelMaps.schemaId, schemaId));
  if (levels.length === 0) return [];
  return db
    .insert(levelMaps)
    .values(
      levels.map((level) => ({
        schemaId,
        levelOrder: level.order,
        levelTypeId: level.levelTypeId,
        isRequired: level.isRequired,
      }))
    )
    .returning();
}

export async function listMaterialNodesByPurpose(db: Db, purpose: number, schemaId?: number) {
  const conditions = [eq(materialNodes.purpose, purpose), eq(materialNodes.isActive, true)];
  if (schemaId) {
    conditions.push(eq(materialNodes.schemaId, schemaId));
  }
  return db
    .select({
      id: materialNodes.id,
      schemaId: materialNodes.schemaId,
      name: materialNodes.name,
      description: materialNodes.description,
      parentId: materialNodes.parentId,
      levelTypeId: materialNodes.levelTypeId,
      levelTypeName: levelTypes.name,
      purpose: materialNodes.purpose,
      value: materialNodes.value,
      unitId: materialNodes.unitId,
      isActive: materialNodes.isActive,
      createdAt: materialNodes.createdAt,
    })
    .from(materialNodes)
    .leftJoin(levelTypes, eq(materialNodes.levelTypeId, levelTypes.id))
    .where(and(...conditions))
    .orderBy(asc(materialNodes.parentId), asc(materialNodes.name), asc(materialNodes.id));
}

export async function findMaterialNodeById(db: Db, id: number) {
  const [row] = await db
    .select({
      id: materialNodes.id,
      schemaId: materialNodes.schemaId,
      name: materialNodes.name,
      description: materialNodes.description,
      parentId: materialNodes.parentId,
      levelTypeId: materialNodes.levelTypeId,
      levelTypeName: levelTypes.name,
      purpose: materialNodes.purpose,
      value: materialNodes.value,
      unitId: materialNodes.unitId,
      isActive: materialNodes.isActive,
      createdAt: materialNodes.createdAt,
    })
    .from(materialNodes)
    .leftJoin(levelTypes, eq(materialNodes.levelTypeId, levelTypes.id))
    .where(eq(materialNodes.id, id));
  return row ?? null;
}

export async function countChildren(db: Db, nodeId: number) {
  const rows = await db
    .select({ id: materialNodes.id })
    .from(materialNodes)
    .where(and(eq(materialNodes.parentId, nodeId), eq(materialNodes.isActive, true)));
  return rows.length;
}

export async function findNodeByParentAndName(
  db: Db,
  schemaId: number,
  parentId: number | null,
  name: string,
  purpose: number
) {
  const parentCondition =
    parentId == null
      ? isNull(materialNodes.parentId)
      : eq(materialNodes.parentId, parentId);
  const [row] = await db
    .select()
    .from(materialNodes)
    .where(
      and(
        eq(materialNodes.schemaId, schemaId),
        parentCondition,
        eq(materialNodes.name, name),
        eq(materialNodes.purpose, purpose),
        eq(materialNodes.isActive, true)
      )
    );
  return row ?? null;
}

export async function createMaterialNode(
  db: Db,
  data: {
    schemaId: number;
    name: string;
    description?: string | null;
    parentId?: number | null;
    levelTypeId?: number | null;
    purpose: number;
    value?: string | null;
    unitId?: number | null;
    createdBy?: string;
  }
) {
  const [row] = await db.insert(materialNodes).values(data).returning();
  return row;
}

export async function updateMaterialNode(
  db: Db,
  id: number,
  data: Partial<{
    name: string;
    description: string | null;
    parentId: number | null;
    levelTypeId: number | null;
    purpose: number;
    value: string | null;
    unitId: number | null;
    isActive: boolean;
  }>
) {
  const [row] = await db
    .update(materialNodes)
    .set(data)
    .where(eq(materialNodes.id, id))
    .returning();
  return row ?? null;
}

export async function deleteMaterialNode(db: Db, id: number) {
  await db.delete(materialTags).where(eq(materialTags.materialNodeId, id));
  await db.delete(materialItems).where(eq(materialItems.materialNodeId, id));
  await db.delete(materialSheets).where(eq(materialSheets.materialNodeId, id));
  await db.delete(materialNodes).where(eq(materialNodes.id, id));
}

export async function listTags(db: Db) {
  return db.select().from(tags).orderBy(asc(tags.name), asc(tags.id));
}

export async function createTag(db: Db, name: string) {
  const [row] = await db.insert(tags).values({ name }).returning();
  return row;
}

export async function deleteTag(db: Db, id: number) {
  await db.delete(materialTags).where(eq(materialTags.tagId, id));
  await db.delete(tags).where(eq(tags.id, id));
}

export async function listMaterialTagsForNodes(db: Db, nodeIds: number[]) {
  if (nodeIds.length === 0) return [];
  return db
    .select({
      id: materialTags.id,
      materialNodeId: materialTags.materialNodeId,
      tagId: materialTags.tagId,
      tagName: tags.name,
    })
    .from(materialTags)
    .innerJoin(tags, eq(materialTags.tagId, tags.id))
    .where(inArray(materialTags.materialNodeId, nodeIds))
    .orderBy(asc(materialTags.materialNodeId), asc(tags.name));
}

export async function bulkAssignTags(db: Db, materialNodeIds: number[], tagId: number) {
  const existing = await db
    .select({ materialNodeId: materialTags.materialNodeId })
    .from(materialTags)
    .where(and(eq(materialTags.tagId, tagId), inArray(materialTags.materialNodeId, materialNodeIds)));
  const existingSet = new Set(existing.map((row) => row.materialNodeId));
  const toInsert = materialNodeIds
    .filter((id) => !existingSet.has(id))
    .map((materialNodeId) => ({ materialNodeId, tagId }));
  if (toInsert.length === 0) return 0;
  await db.insert(materialTags).values(toInsert);
  return toInsert.length;
}

export async function bulkRemoveTags(db: Db, materialNodeIds: number[], tagId: number) {
  await db
    .delete(materialTags)
    .where(and(eq(materialTags.tagId, tagId), inArray(materialTags.materialNodeId, materialNodeIds)));
}

export async function listMaterialItemsForNodes(db: Db, nodeIds: number[]) {
  if (nodeIds.length === 0) return [];
  return db
    .select()
    .from(materialItems)
    .where(inArray(materialItems.materialNodeId, nodeIds))
    .orderBy(asc(materialItems.fullName), asc(materialItems.id));
}

export async function createMaterialItem(
  db: Db,
  data: { materialNodeId: number; fullName: string; pathIds?: string | null }
) {
  const [row] = await db.insert(materialItems).values(data).returning();
  return row;
}

export async function updateMaterialItem(
  db: Db,
  id: number,
  data: { fullName?: string; pathIds?: string | null }
) {
  const [row] = await db
    .update(materialItems)
    .set(data)
    .where(eq(materialItems.id, id))
    .returning();
  return row ?? null;
}

export async function deleteMaterialItem(db: Db, id: number) {
  await db.delete(materialItems).where(eq(materialItems.id, id));
}

export async function listSheetSummaries(db: Db, schemaId?: number) {
  const query = db
    .select({
      schemaId: materialSheets.schemaId,
      materialNodeId: materialSheets.materialNodeId,
      rowsJson: materialSheets.rowsJson,
      updatedAt: materialSheets.updatedAt,
    })
    .from(materialSheets);
  const rows = schemaId
    ? await query.where(eq(materialSheets.schemaId, schemaId))
    : await query;
  return rows.map((row) => ({
    schemaId: row.schemaId,
    materialNodeId: row.materialNodeId,
    recordCount: countSheetRows(row.rowsJson),
    updatedAt: row.updatedAt?.toISOString() ?? null,
  }));
}

function countSheetRows(rowsJson: string | null): number {
  if (!rowsJson) return 0;
  try {
    const parsed = JSON.parse(rowsJson);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export async function findTagByName(db: Db, name: string) {
  const [row] = await db.select().from(tags).where(eq(tags.name, name));
  return row ?? null;
}

export async function listAllTags(db: Db) {
  return db.select().from(tags).orderBy(asc(tags.id));
}

export async function createMaterialTagLink(db: Db, materialNodeId: number, tagId: number) {
  const [row] = await db
    .insert(materialTags)
    .values({ materialNodeId, tagId })
    .returning();
  return row;
}

export async function tagLinkExists(db: Db, materialNodeId: number, tagId: number) {
  const rows = await db
    .select({ id: materialTags.id })
    .from(materialTags)
    .where(and(eq(materialTags.materialNodeId, materialNodeId), eq(materialTags.tagId, tagId)));
  return rows.length > 0;
}

export async function getSheetByScope(
  db: Db,
  schemaId: number,
  materialNodeId: number | null
) {
  const nodeCondition =
    materialNodeId == null
      ? isNull(materialSheets.materialNodeId)
      : eq(materialSheets.materialNodeId, materialNodeId);
  const [row] = await db
    .select()
    .from(materialSheets)
    .where(and(eq(materialSheets.schemaId, schemaId), nodeCondition));
  return row ?? null;
}

export async function upsertSheet(
  db: Db,
  data: {
    schemaId: number;
    materialNodeId: number | null;
    columnsJson: string;
    rowsJson: string;
  }
) {
  const existing = await getSheetByScope(db, data.schemaId, data.materialNodeId);
  if (existing) {
    const [row] = await db
      .update(materialSheets)
      .set({
        columnsJson: data.columnsJson,
        rowsJson: data.rowsJson,
        updatedAt: new Date(),
      })
      .where(eq(materialSheets.id, existing.id))
      .returning();
    return row;
  }
  const [row] = await db.insert(materialSheets).values(data).returning();
  return row;
}
