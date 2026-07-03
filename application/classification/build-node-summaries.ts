import type { MaterialTreeNodeSummaryEntity } from '@/domain/classification/entities';
import { MaterialPurpose } from '@/domain/classification/material-purpose';
import type { ClassificationStateDto } from '@/application/classification/dto';
import type { Db } from '@/infrastructure/persistence/db';
import {
  listLevelTypes,
  listMaterialItemsForNodes,
  listMaterialNodesByPurpose,
  listMaterialTagsForNodes,
  listSheetSummaries,
  listTags,
} from '@/infrastructure/persistence/repositories/classification/repository';

type MaterialRow = Awaited<ReturnType<typeof listMaterialNodesByPurpose>>[number];

function buildNodeSummaries(
  materials: MaterialRow[],
  materialItems: Awaited<ReturnType<typeof listMaterialItemsForNodes>>,
  materialTagRows: Awaited<ReturnType<typeof listMaterialTagsForNodes>>,
  sheetSummaries: Awaited<ReturnType<typeof listSheetSummaries>>
): MaterialTreeNodeSummaryEntity[] {
  const childrenByParentId = new Map<number, MaterialRow[]>();
  for (const material of materials) {
    if (material.parentId == null) continue;
    const bucket = childrenByParentId.get(material.parentId) ?? [];
    bucket.push(material);
    childrenByParentId.set(material.parentId, bucket);
  }

  const directTagCounts = new Map<number, number>();
  const tagsByMaterialId = new Map<number, Set<number>>();
  for (const tag of materialTagRows) {
    directTagCounts.set(
      tag.materialNodeId,
      (directTagCounts.get(tag.materialNodeId) ?? 0) + 1
    );
    const set = tagsByMaterialId.get(tag.materialNodeId) ?? new Set<number>();
    set.add(tag.tagId);
    tagsByMaterialId.set(tag.materialNodeId, set);
  }

  const materialItemCounts = new Map<number, number>();
  for (const item of materialItems) {
    materialItemCounts.set(
      item.materialNodeId,
      (materialItemCounts.get(item.materialNodeId) ?? 0) + 1
    );
  }

  const summariesByMaterialId = new Map<number, (typeof sheetSummaries)[number]>();
  for (const summary of sheetSummaries) {
    if (summary.materialNodeId != null) {
      summariesByMaterialId.set(summary.materialNodeId, summary);
    }
  }

  const materialById = new Map(materials.map((m) => [m.id, m]));
  const descendantCache = new Map<number, number>();
  const inheritedCache = new Map<number, Set<number>>();

  const countDescendants = (materialId: number, path = new Set<number>()): number => {
    const cached = descendantCache.get(materialId);
    if (cached != null) return cached;
    if (!path.add(materialId)) {
      descendantCache.set(materialId, 0);
      return 0;
    }
    const children = childrenByParentId.get(materialId) ?? [];
    const total = children.reduce(
      (sum, child) => sum + 1 + countDescendants(child.id, path),
      0
    );
    path.delete(materialId);
    descendantCache.set(materialId, total);
    return total;
  };

  const getInheritedTagIds = (materialId: number, path = new Set<number>()): Set<number> => {
    const cached = inheritedCache.get(materialId);
    if (cached) return cached;
    if (!path.add(materialId)) {
      inheritedCache.set(materialId, new Set());
      return inheritedCache.get(materialId)!;
    }
    const material = materialById.get(materialId);
    if (!material?.parentId || !materialById.has(material.parentId)) {
      inheritedCache.set(materialId, new Set());
      path.delete(materialId);
      return inheritedCache.get(materialId)!;
    }
    const inherited = getInheritedTagIds(material.parentId, path);
    const parentTags = tagsByMaterialId.get(material.parentId);
    if (parentTags) {
      for (const tagId of parentTags) inherited.add(tagId);
    }
    path.delete(materialId);
    inheritedCache.set(materialId, inherited);
    return inherited;
  };

  return materials.map((material) => {
    const sheetSummary = summariesByMaterialId.get(material.id);
    const materialRecordCount = sheetSummary?.recordCount ?? 0;
    return {
      materialId: material.id,
      childrenCount: childrenByParentId.get(material.id)?.length ?? 0,
      descendantCount: countDescendants(material.id),
      directTagCount: directTagCounts.get(material.id) ?? 0,
      inheritedTagCount: getInheritedTagIds(material.id).size,
      materialItemCount: materialItemCounts.get(material.id) ?? 0,
      materialRecordCount,
      priceRecordCount: 0,
      recordCount: materialRecordCount,
      hasPriceSheet: sheetSummary != null,
    };
  });
}

export async function getClassificationState(
  db: Db,
  schemaId?: number
): Promise<ClassificationStateDto> {
  const purpose = MaterialPurpose.SystemOption;
  const [levelTypeRows, materialRows, tagRows] = await Promise.all([
    listLevelTypes(db),
    listMaterialNodesByPurpose(db, purpose, schemaId),
    listTags(db),
  ]);

  const nodeIds = materialRows.map((m) => m.id);
  const [materialItemRows, materialTagRows, sheetSummaries] = await Promise.all([
    listMaterialItemsForNodes(db, nodeIds),
    listMaterialTagsForNodes(db, nodeIds),
    listSheetSummaries(db, schemaId),
  ]);

  const parentNames = new Map(materialRows.map((m) => [m.id, m.name]));

  return {
    schemaId: schemaId ?? null,
    generatedAt: new Date().toISOString(),
    levelTypes: levelTypeRows.map((lt) => ({
      id: lt.id,
      name: lt.name,
      prefix: lt.prefix,
      suffix: lt.suffix,
      isNumeric: lt.isNumeric,
      standardUnitId: lt.standardUnitId,
      isActive: lt.isActive,
    })),
    materials: materialRows.map((m) => ({
      id: m.id,
      schemaId: m.schemaId,
      name: m.name,
      description: m.description,
      materialPurpose: m.purpose,
      levelTypeId: m.levelTypeId,
      levelTypeName: m.levelTypeName,
      parentId: m.parentId,
      parentName: m.parentId ? (parentNames.get(m.parentId) ?? null) : null,
      value: m.value,
      unitId: m.unitId,
      isActive: m.isActive,
      createdAt: m.createdAt.toISOString(),
    })),
    materialItems: materialItemRows.map((item) => ({
      id: item.id,
      materialNodeId: item.materialNodeId,
      fullName: item.fullName,
      pathIds: item.pathIds,
    })),
    tags: tagRows.map((tag) => ({ id: tag.id, name: tag.name })),
    materialTags: materialTagRows.map((mt) => ({
      id: mt.id,
      materialNodeId: mt.materialNodeId,
      tagId: mt.tagId,
      tagName: mt.tagName,
    })),
    sheetSummaries,
    nodeSummaries: buildNodeSummaries(
      materialRows,
      materialItemRows,
      materialTagRows,
      sheetSummaries
    ),
  };
}
