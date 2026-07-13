import { describe, expect, it } from 'vitest';
import {
  buildCatalogTagContext,
  filterCatalogTagRecords,
  isAssignableMaterialTag,
  isCatalogTagName,
  isSelfCategoryTag,
  matchesCategoryName,
  MIN_CROSS_CATEGORY_TAG_ASSIGNMENTS,
} from './category-tag-display';

describe('category-tag-display', () => {
  const materials = [
    { id: 1, name: 'HVAC', schemaId: 1, isActive: true, parentId: null },
    { id: 2, name: 'Ceiling Diffuser', schemaId: 1, isActive: true, parentId: 1 },
    { id: 3, name: '1 Gang', schemaId: 1, isActive: true, parentId: 2 },
    { id: 4, name: 'Air Cooled Chiller', schemaId: 1, isActive: true, parentId: 1 },
  ];

  const materialTags = [
    { materialNodeId: 1, tagName: 'HVAC' },
    { materialNodeId: 2, tagName: 'HVAC' },
    { materialNodeId: 2, tagName: 'Ceiling Diffuser' },
    { materialNodeId: 3, tagName: '1 Gang' },
    { materialNodeId: 4, tagName: 'Air Cooled Chiller' },
    { materialNodeId: 2, tagName: 'Air Cooled Chiller' },
    { materialNodeId: 3, tagName: 'HVAC' },
  ];

  const ctx = buildCatalogTagContext(materials, materialTags, 1);

  it('detects self-category tags', () => {
    expect(isSelfCategoryTag('Ceiling Diffuser', 'Ceiling Diffuser')).toBe(true);
    expect(isSelfCategoryTag('#1 kg', '1 kg')).toBe(true);
    expect(isSelfCategoryTag('HVAC', 'Ceiling Diffuser')).toBe(false);
  });

  it('treats root discipline labels as catalog tags when widely assigned', () => {
    const hvacCount = ctx.nonSelfCountByTagLower.get('hvac') ?? 0;
    expect(hvacCount).toBeGreaterThanOrEqual(MIN_CROSS_CATEGORY_TAG_ASSIGNMENTS);
    expect(
      isCatalogTagName('HVAC', ctx.categoryNamesLower, hvacCount, ctx.rootCategoryNamesLower, ctx.categoryTokens),
    ).toBe(true);
  });

  it('rejects non-root category names even with assignments', () => {
    const chillerCount = ctx.nonSelfCountByTagLower.get('air cooled chiller') ?? 0;
    expect(
      isCatalogTagName(
        'Air Cooled Chiller',
        ctx.categoryNamesLower,
        chillerCount,
        ctx.rootCategoryNamesLower,
        ctx.categoryTokens,
      ),
    ).toBe(false);
    expect(
      isCatalogTagName('1 Gang', ctx.categoryNamesLower, 1, ctx.rootCategoryNamesLower, ctx.categoryTokens),
    ).toBe(false);
  });

  it('matches category names by normalized token', () => {
    expect(
      matchesCategoryName('Air Cooled Chiller', ctx.categoryNamesLower, ctx.categoryTokens),
    ).toBe(true);
    expect(matchesCategoryName('1 Gang', ctx.categoryNamesLower, ctx.categoryTokens)).toBe(true);
    expect(matchesCategoryName('Custom Label', ctx.categoryNamesLower, ctx.categoryTokens)).toBe(
      false,
    );
  });

  it('filters catalog tag records to real tags only', () => {
    const tags = [
      { id: 1, name: 'HVAC' },
      { id: 2, name: '1 Gang' },
      { id: 3, name: 'Air Cooled Chiller' },
      { id: 4, name: 'Custom Label' },
    ];
    const filtered = filterCatalogTagRecords(
      tags,
      { materials, materialTags, tags } as never,
      1,
    );
    expect(filtered.map((tag) => tag.name)).toEqual(['HVAC']);
  });

  it('excludes invalid assignments from filter counts', () => {
    expect(
      isAssignableMaterialTag(
        '1 Gang',
        3,
        ctx.nodeNameById,
        ctx.categoryNamesLower,
        ctx.nonSelfCountByTagLower,
        ctx.rootCategoryNamesLower,
        ctx.categoryTokens,
      ),
    ).toBe(false);
    expect(
      isAssignableMaterialTag(
        'HVAC',
        2,
        ctx.nodeNameById,
        ctx.categoryNamesLower,
        ctx.nonSelfCountByTagLower,
        ctx.rootCategoryNamesLower,
        ctx.categoryTokens,
      ),
    ).toBe(true);
  });
});
