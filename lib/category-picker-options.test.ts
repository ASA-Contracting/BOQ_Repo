import { describe, expect, it } from 'vitest';

import {
  buildCategoryPickerOptions,
  collectCategoryPickerAvailableTags,
  filterCategoryPickerOptions,
  formatSectionPickerLabel,
  getCategoryPickerDisplayLabel,
  resolveCategoryParentLabel,
  withSectionPickerLabels,
} from './category-picker-options';

describe('category-picker-options', () => {
  it('builds hierarchical paths for picker options', () => {
    const options = buildCategoryPickerOptions([
      { id: 1, name: 'Mechanical', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
      { id: 2, name: 'AHU', materialLevelTypeId: 2, parentId: 1, schemaId: 1, isActive: true },
    ]);

    expect(options).toHaveLength(2);
    expect(options.find((option) => option.id === 2)?.path).toBe('Mechanical / AHU');
    expect(options.find((option) => option.id === 2)?.parentLabel).toBe('Mechanical');
    expect(options.find((option) => option.id === 1)?.parentLabel).toBeNull();
  });

  it('filters options by label and path', () => {
    const options = buildCategoryPickerOptions([
      { id: 1, name: 'Mechanical', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
      { id: 2, name: 'AHU', materialLevelTypeId: 2, parentId: 1, schemaId: 1, isActive: true },
    ]);

    expect(filterCategoryPickerOptions(options, 'ahu')).toEqual([
      expect.objectContaining({ id: 2, label: 'AHU' }),
    ]);
  });

  it('resolves immediate parent label for a selected category', () => {
    const options = buildCategoryPickerOptions([
      { id: 1, name: 'HVAC', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
      { id: 2, name: 'Air Outlets', materialLevelTypeId: 2, parentId: 1, schemaId: 1, isActive: true },
      { id: 3, name: 'Ceiling Diffuser', materialLevelTypeId: 3, parentId: 2, schemaId: 1, isActive: true },
    ]);

    expect(resolveCategoryParentLabel(3, options)).toBe('Air Outlets');
    expect(resolveCategoryParentLabel(2, options)).toBe('HVAC');
    expect(resolveCategoryParentLabel(1, options)).toBeNull();
  });

  it('prefixes section picker labels', () => {
    const options = buildCategoryPickerOptions([
      { id: 1, name: 'Air Outlets', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
    ]);

    expect(formatSectionPickerLabel('Air Outlets')).toBe('Section - Air Outlets');
    expect(withSectionPickerLabels(options)[0]?.pickerLabel).toBe('Section - Air Outlets');
    expect(filterCategoryPickerOptions(withSectionPickerLabels(options), 'section air')).toHaveLength(1);
  });

  it('formats selected category as parent - chosen in the cell', () => {
    const options = buildCategoryPickerOptions([
      { id: 1, name: 'HVAC', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
      { id: 2, name: 'Air Outlets', materialLevelTypeId: 2, parentId: 1, schemaId: 1, isActive: true },
      { id: 3, name: 'Ceiling Diffuser', materialLevelTypeId: 3, parentId: 2, schemaId: 1, isActive: true },
    ]);

    expect(getCategoryPickerDisplayLabel(options[0]!)).toBe('HVAC');
    expect(getCategoryPickerDisplayLabel(options[1]!)).toBe('HVAC - Air Outlets');
    expect(getCategoryPickerDisplayLabel(options[2]!)).toBe('Air Outlets - Ceiling Diffuser');
  });

  it('includes direct and inherited tags on picker options', () => {
    const options = buildCategoryPickerOptions(
      [
        { id: 1, name: 'HVAC', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
        { id: 2, name: 'AHU', materialLevelTypeId: 2, parentId: 1, schemaId: 1, isActive: true },
      ],
      [{ materialNodeId: 1, tagName: 'Mechanical' }],
    );

    expect(options.find((option) => option.id === 1)?.directTagNames).toEqual(['Mechanical']);
    expect(options.find((option) => option.id === 2)?.tagNames).toEqual(['Mechanical']);
    expect(options.find((option) => option.id === 2)?.directTagNames).toEqual([]);
  });

  it('filters options by selected tags', () => {
    const options = buildCategoryPickerOptions(
      [
        { id: 1, name: 'HVAC', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
        { id: 2, name: 'Plumbing', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
      ],
      [
        { materialNodeId: 1, tagName: 'Mechanical' },
        { materialNodeId: 2, tagName: 'Wet' },
      ],
    );

    expect(filterCategoryPickerOptions(options, '', ['mechanical'])).toEqual([
      expect.objectContaining({ id: 1 }),
    ]);
    expect(collectCategoryPickerAvailableTags(options)).toEqual([
      { name: 'Mechanical', count: 1 },
      { name: 'Wet', count: 1 },
    ]);
  });
});
