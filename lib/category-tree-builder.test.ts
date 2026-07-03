import { describe, expect, it } from 'vitest';
import type { ClassificationStateDto } from '@/application/classification/dto';
import { buildCategoryExportCsv, buildCategoryExportRows } from './category-export';
import { buildCategoryTreeRoot, collectAvailableTags } from './category-tree-builder';

const sampleState: ClassificationStateDto = {
  schemaId: 1,
  generatedAt: '2026-01-01T00:00:00.000Z',
  levelTypes: [],
  materials: [
    {
      id: 1,
      schemaId: 1,
      name: 'HVAC',
      materialPurpose: 1,
      levelTypeId: 1,
      parentId: null,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      schemaId: 1,
      name: 'Air Handling Units',
      materialPurpose: 1,
      levelTypeId: 2,
      parentId: 1,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  materialItems: [{ id: 10, materialNodeId: 2, fullName: 'AHU-1' }],
  tags: [{ id: 1, name: 'hvac' }],
  materialTags: [{ id: 1, materialNodeId: 2, tagId: 1, tagName: 'hvac' }],
  sheetSummaries: [],
  nodeSummaries: [
    {
      materialId: 1,
      childrenCount: 1,
      descendantCount: 1,
      directTagCount: 0,
      inheritedTagCount: 0,
      materialItemCount: 0,
      materialRecordCount: 0,
      priceRecordCount: 0,
      recordCount: 0,
      hasPriceSheet: false,
    },
    {
      materialId: 2,
      childrenCount: 0,
      descendantCount: 0,
      directTagCount: 1,
      inheritedTagCount: 0,
      materialItemCount: 1,
      materialRecordCount: 1,
      priceRecordCount: 0,
      recordCount: 1,
      hasPriceSheet: false,
    },
  ],
};

describe('category-tree-builder', () => {
  it('builds nested tree with tags and record counts', () => {
    const root = buildCategoryTreeRoot({
      state: sampleState,
      schemaId: 1,
      chainSteps: [
        { levelTypeId: 1, order: 1, isRequired: true },
        { levelTypeId: 2, order: 2, isRequired: true },
      ],
      search: '',
      filter: 'all',
      tagFilterNames: new Set(),
      expandedIds: new Set([1]),
      selectedId: 2,
      selectedIds: new Set(),
      inline: null,
    });

    expect(root.children).toHaveLength(1);
    expect(root.children[0].children[0].recordCount).toBe(1);
    expect(root.children[0].children[0].tags?.[0].label).toBe('hvac');
  });

  it('filters tree by material-records mode', () => {
    const root = buildCategoryTreeRoot({
      state: sampleState,
      schemaId: 1,
      chainSteps: [],
      search: '',
      filter: 'material-records',
      tagFilterNames: new Set(),
      expandedIds: new Set([1]),
      selectedId: null,
      selectedIds: new Set(),
      inline: null,
    });

    expect(root.children[0].children).toHaveLength(1);
    expect(root.children[0].label).toBe('HVAC');
  });

  it('collects available tags with counts including inherited tags', () => {
    const withInheritance: ClassificationStateDto = {
      ...sampleState,
      materials: [
        ...sampleState.materials,
        {
          id: 3,
          schemaId: 1,
          name: 'Child inherits',
          materialPurpose: 1,
          levelTypeId: 2,
          parentId: 1,
          isActive: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      tags: [
        { id: 1, name: 'hvac' },
        { id: 2, name: 'Electrical' },
      ],
      materialTags: [
        { id: 1, materialNodeId: 1, tagId: 1, tagName: 'hvac' },
        { id: 2, materialNodeId: 2, tagId: 1, tagName: 'hvac' },
        { id: 3, materialNodeId: 3, tagId: 2, tagName: 'Electrical' },
      ],
    };

    expect(collectAvailableTags(withInheritance, 1)).toEqual([
      { name: 'Electrical', count: 1 },
      { name: 'hvac', count: 3 },
    ]);
  });
});

describe('category-export', () => {
  it('builds export rows and csv', () => {
    const rows = buildCategoryExportRows(sampleState, 1);
    expect(rows).toHaveLength(2);
    expect(rows[1].tags).toEqual(['hvac']);
    const csv = buildCategoryExportCsv(sampleState, 1);
    expect(csv).toContain('Level 1');
    expect(csv).toContain('Air Handling Units');
  });
});
