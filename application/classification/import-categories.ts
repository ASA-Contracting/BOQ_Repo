import { normalizeToken } from '@/domain/classification/classification-policy';
import { MaterialPurpose } from '@/domain/classification/material-purpose';
import type { ImportRequestDto, ImportResultDto } from '@/application/classification/dto';
import type { Db } from '@/infrastructure/persistence/db';
import {
  createMaterialNode,
  createMaterialTagLink,
  createTag,
  findLevelMapsBySchemaId,
  findNodeByParentAndName,
  listAllTags,
  listMaterialNodesByPurpose,
  tagLinkExists,
} from '@/infrastructure/persistence/repositories/classification/repository';
import { getClassificationState } from './get-classification-state';

const MAX_ROWS = 10000;
const MAX_NAME_LENGTH = 160;
const MAX_TAG_LENGTH = 64;
const MAX_TAGS_PER_ROW = 24;

type NormalizedRow = {
  rowNumber?: number;
  path: string[];
  tags: string[];
};

function normalizeImportToken(value: string): string {
  return normalizeToken(value);
}

function buildImportNodeKey(parentId: number | null, name: string): string {
  return `${parentId ?? 'root'}::${normalizeImportToken(name)}`;
}

function buildImportPathKey(path: string[]): string {
  return path.map((segment) => normalizeImportToken(segment)).join('>');
}

function normalizeImportRows(rows: ImportRequestDto['rows']): NormalizedRow[] {
  return rows.map((row, index) => ({
    rowNumber: row.rowNumber ?? index + 1,
    path: row.path.map((segment) => segment.trim()).filter(Boolean),
    tags: row.tags.map((tag) => tag.trim()).filter(Boolean),
  }));
}

function validateRow(row: NormalizedRow, result: ImportResultDto, maxDepth: number) {
  if (row.path.length === 0) {
    result.issues.push({
      severity: 'error',
      rowNumber: row.rowNumber,
      message: `Row ${row.rowNumber ?? 0}: path is empty.`,
    });
  }
  for (const segment of row.path) {
    if (segment.length > MAX_NAME_LENGTH) {
      result.issues.push({
        severity: 'error',
        rowNumber: row.rowNumber,
        message: `Row ${row.rowNumber ?? 0}: category name exceeds ${MAX_NAME_LENGTH} characters.`,
      });
    }
  }
  if (row.path.length > maxDepth) {
    result.issues.push({
      severity: 'error',
      rowNumber: row.rowNumber,
      message: `Row ${row.rowNumber ?? 0}: has ${row.path.length} category levels, but this schema supports ${maxDepth}.`,
    });
  }
  if (row.tags.length > MAX_TAGS_PER_ROW) {
    result.issues.push({
      severity: 'error',
      rowNumber: row.rowNumber,
      message: `Row ${row.rowNumber ?? 0}: exceeds ${MAX_TAGS_PER_ROW} tags.`,
    });
  }
  for (const tag of row.tags) {
    if (tag.length > MAX_TAG_LENGTH) {
      result.issues.push({
        severity: 'error',
        rowNumber: row.rowNumber,
        message: `Row ${row.rowNumber ?? 0}: tag exceeds ${MAX_TAG_LENGTH} characters.`,
      });
    }
  }
}

async function loadSchemaLevelTypeIds(db: Db, schemaId?: number): Promise<number[]> {
  if (!schemaId) return [];
  const maps = await findLevelMapsBySchemaId(db, schemaId);
  return maps.map((map) => map.levelTypeId);
}

export async function previewCategoryImport(
  db: Db,
  dto: ImportRequestDto
): Promise<ImportResultDto> {
  return buildCategoryImportResult(db, dto, false);
}

export async function importCategories(
  db: Db,
  dto: ImportRequestDto
): Promise<ImportResultDto> {
  const preview = await buildCategoryImportResult(db, dto, false);
  if (preview.issues.some((issue) => issue.severity === 'error')) {
    return preview;
  }
  const result = await buildCategoryImportResult(db, dto, true);
  if (dto.schemaId) {
    result.state = await getClassificationState(db, dto.schemaId);
  }
  return result;
}

async function buildCategoryImportResult(
  db: Db,
  dto: ImportRequestDto,
  applyChanges: boolean
): Promise<ImportResultDto> {
  const rows = normalizeImportRows(dto.rows);
  const schemaLevelTypeIds = await loadSchemaLevelTypeIds(db, dto.schemaId);
  const maxDepth = dto.maxDepth ?? Math.max(schemaLevelTypeIds.length, 1);

  const result: ImportResultDto = {
    requestedRowCount: dto.rows.length,
    validRowCount: 0,
    existingPathCount: 0,
    newCategoryCount: 0,
    newTagCount: 0,
    assignedTagCount: 0,
    issues: [],
    rows: [],
  };

  if (rows.length === 0) {
    result.issues.push({ severity: 'error', message: 'No category rows were supplied.' });
    return result;
  }
  if (rows.length > MAX_ROWS) {
    result.issues.push({
      severity: 'error',
      message: `Category import is limited to ${MAX_ROWS} rows per file.`,
    });
  }

  const seenPathKeys = new Set<string>();
  for (const row of rows) {
    validateRow(row, result, maxDepth);
    const pathKey = buildImportPathKey(row.path);
    if (!seenPathKeys.add(pathKey)) {
      result.issues.push({
        severity: 'warning',
        rowNumber: row.rowNumber,
        message: `Row ${row.rowNumber ?? 0}: duplicate category path in this file.`,
      });
    }
  }

  if (result.issues.some((issue) => issue.severity === 'error')) {
    result.rows = rows.map((row) => ({
      rowNumber: row.rowNumber,
      path: row.path,
      tags: row.tags,
    }));
    return result;
  }

  if (!dto.schemaId) {
    result.issues.push({ severity: 'error', message: 'schemaId is required for import.' });
    return result;
  }

  const materialEntities = await listMaterialNodesByPurpose(
    db,
    MaterialPurpose.SystemOption,
    dto.schemaId
  );
  const materialsByParentAndName = new Map<string, (typeof materialEntities)[number]>();
  for (const material of materialEntities) {
    const key = buildImportNodeKey(material.parentId, material.name);
    if (!materialsByParentAndName.has(key)) {
      materialsByParentAndName.set(key, material);
    }
  }

  const tagEntities = await listAllTags(db);
  const tagsByName = new Map<string, (typeof tagEntities)[number]>();
  for (const tag of tagEntities) {
    tagsByName.set(normalizeImportToken(tag.name), tag);
  }

  if (applyChanges) {
    for (const row of rows) {
      for (const tagName of row.tags) {
        const tagKey = normalizeImportToken(tagName);
        if (tagsByName.has(tagKey)) continue;
        const created = await createTag(db, tagName);
        tagsByName.set(tagKey, created);
        result.newTagCount += 1;
      }
    }
  }

  for (const row of rows) {
    let parentId: number | null = null;
    let existingLevelCount = 0;
    let newLevelCount = 0;
    let leaf: (typeof materialEntities)[number] | null = null;

    for (let depth = 0; depth < row.path.length; depth++) {
      const name = row.path[depth];
      const key = buildImportNodeKey(parentId, name);
      const existing = materialsByParentAndName.get(key);
      if (existing) {
        leaf = existing;
        parentId = existing.id;
        existingLevelCount += 1;
        continue;
      }

      newLevelCount += 1;
      if (!applyChanges) {
        newLevelCount += row.path.length - depth - 1;
        break;
      }

      const created = await createMaterialNode(db, {
        schemaId: dto.schemaId,
        name,
        parentId,
        levelTypeId:
          depth < schemaLevelTypeIds.length ? schemaLevelTypeIds[depth] : null,
        purpose: MaterialPurpose.SystemOption,
      });
      materialsByParentAndName.set(key, {
        ...created,
        levelTypeName: null,
      });
      leaf = {
        ...created,
        levelTypeName: null,
      };
      parentId = created.id;
      result.newCategoryCount += 1;
    }

    result.validRowCount += 1;
    if (newLevelCount === 0) result.existingPathCount += 1;

    result.rows.push({
      rowNumber: row.rowNumber,
      path: row.path,
      tags: row.tags,
      existingLevelCount,
      newLevelCount,
      exists: newLevelCount === 0,
    });

    if (!applyChanges || !leaf || row.tags.length === 0) continue;

    for (const tagName of row.tags) {
      const tag = tagsByName.get(normalizeImportToken(tagName));
      if (!tag) continue;
      const exists = await tagLinkExists(db, leaf.id, tag.id);
      if (exists) continue;
      await createMaterialTagLink(db, leaf.id, tag.id);
      result.assignedTagCount += 1;
    }
  }

  return result;
}

export function exportCategoryTreeCsv(state: Awaited<ReturnType<typeof getClassificationState>>): string {
  const materialsById = new Map(state.materials.map((m) => [m.id, m]));
  const pathCache = new Map<number, typeof state.materials>();

  const getPath = (materialId: number) => {
    const cached = pathCache.get(materialId);
    if (cached) return cached;
    const path: typeof state.materials = [];
    const visited = new Set<number>();
    let currentId: number | null = materialId;
    while (currentId != null && !visited.has(currentId)) {
      visited.add(currentId);
      const current = materialsById.get(currentId);
      if (!current) break;
      path.unshift(current);
      currentId = current.parentId;
    }
    pathCache.set(materialId, path);
    return path;
  };

  const rows = state.materials
    .filter((m) => m.isActive)
    .map((material) => ({ material, path: getPath(material.id) }))
    .sort((a, b) =>
      a.path.map((p) => p.name).join(' / ').localeCompare(b.path.map((p) => p.name).join(' / '))
    );

  const maxDepth = Math.max(1, ...rows.map((row) => row.path.length));
  const header = [
    ...Array.from({ length: maxDepth }, (_, i) => `Level ${i + 1}`),
    'Tags',
    'Child branches',
    'Material records',
    'Full path',
  ];

  const directTagsByMaterialId = new Map<number, string[]>();
  for (const mt of state.materialTags) {
    const bucket = directTagsByMaterialId.get(mt.materialNodeId) ?? [];
    bucket.push(mt.tagName);
    directTagsByMaterialId.set(mt.materialNodeId, bucket);
  }
  const summariesById = new Map(state.nodeSummaries.map((s) => [s.materialId, s]));

  const escapeCsv = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };

  const lines = [header.join(',')];
  for (const row of rows) {
    const values = row.path.map((p) => p.name);
    while (values.length < maxDepth) values.push('');
    const summary = summariesById.get(row.material.id);
    values.push((directTagsByMaterialId.get(row.material.id) ?? []).join('; '));
    values.push(String(summary?.childrenCount ?? 0));
    values.push(String(summary?.materialRecordCount ?? 0));
    values.push(row.path.map((p) => p.name).join(' > '));
    lines.push(values.map(escapeCsv).join(','));
  }
  return `${lines.join('\n')}\n`;
}
