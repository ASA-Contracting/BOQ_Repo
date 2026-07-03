import type { ClassificationStateDto } from '@/application/classification/dto';
import { buildMaterialClassificationTreeIndex } from '@/domain/classification/tree-index';

export type CategoryExportRow = {
  id: number;
  parentId: number | null;
  name: string;
  path: string;
  levels: string[];
  tags: string[];
  childrenCount: number;
  materialItemCount: number;
  priceRecordCount: number;
  fullPath: string;
};

function csvCell(value: string | number): string {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCategoryExportRows(
  state: ClassificationStateDto,
  schemaId: number
): CategoryExportRow[] {
  const materials = state.materials.filter((m) => m.schemaId === schemaId && m.isActive);
  const treeIndex = buildMaterialClassificationTreeIndex(
    materials.map((m) => ({
      id: m.id,
      name: m.name,
      materialLevelTypeId: m.levelTypeId,
      parentId: m.parentId,
      schemaId: m.schemaId,
      isActive: m.isActive,
    }))
  );

  const summaryById = new Map(state.nodeSummaries.map((s) => [s.materialId, s]));
  const tagsByNodeId = new Map<number, string[]>();
  for (const link of state.materialTags) {
    const bucket = tagsByNodeId.get(link.materialNodeId) ?? [];
    bucket.push(link.tagName);
    tagsByNodeId.set(link.materialNodeId, bucket);
  }

  return materials.map((material) => {
    const path = treeIndex.pathById.get(material.id) ?? [material];
    const levels = path.map((node) => node.name);
    const summary = summaryById.get(material.id);
    const tags = (tagsByNodeId.get(material.id) ?? []).sort((a, b) => a.localeCompare(b));
    return {
      id: material.id,
      parentId: material.parentId,
      name: material.name,
      path: levels.join(' / '),
      levels,
      tags,
      childrenCount: summary?.childrenCount ?? 0,
      materialItemCount: summary?.materialItemCount ?? 0,
      priceRecordCount: summary?.priceRecordCount ?? 0,
      fullPath: levels.join(' > '),
    };
  });
}

export function buildCategoryExportCsv(
  state: ClassificationStateDto,
  schemaId: number
): string {
  const rows = buildCategoryExportRows(state, schemaId);
  const maxDepth = Math.max(1, ...rows.map((row) => row.levels.length));
  const headers = Array.from({ length: maxDepth }, (_item, index) => `Level ${index + 1}`);
  const csvRows = [
    [
      ...headers,
      'Tags',
      'Child branches',
      'Material records',
      'Price records',
      'Full path',
    ],
    ...rows
      .map((row) => {
        const levels = [...row.levels];
        while (levels.length < maxDepth) {
          levels.push('');
        }
        return [
          ...levels,
          row.tags.join('; '),
          String(row.childrenCount),
          String(row.materialItemCount),
          String(row.priceRecordCount),
          row.fullPath,
        ];
      })
      .sort((left, right) => left[left.length - 1].localeCompare(right[right.length - 1])),
  ];
  return csvRows.map((row) => row.map((value) => csvCell(value)).join(',')).join('\n') + '\n';
}

export function downloadCategoryExportCsv(
  state: ClassificationStateDto,
  schemaId: number,
  filenamePrefix = 'material-category-tree'
): void {
  const csv = buildCategoryExportCsv(state, schemaId);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const pad = (value: number) => String(value).padStart(2, '0');
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
  anchor.href = url;
  anchor.download = `${filenamePrefix}-${stamp}.csv`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
