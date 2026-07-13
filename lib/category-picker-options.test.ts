import { describe, expect, it } from 'vitest';

import {
  buildCategoryPickerOptions,
  collectCategoryPickerAvailableTags,
  filterCategoryPickerOptions,
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

  it('keeps section keyword in search text without changing labels', () => {
    const options = buildCategoryPickerOptions([
      { id: 1, name: 'Air Outlets', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
    ]);

    const sectionOptions = withSectionPickerLabels(options);
    expect(sectionOptions[0]?.pickerLabel).toBeUndefined();
    expect(getCategoryPickerDisplayLabel(sectionOptions[0]!)).toBe('Air Outlets');
    expect(filterCategoryPickerOptions(sectionOptions, 'section air')).toHaveLength(1);
  });

  it('formats selected category as node name in the picker', () => {
    const options = buildCategoryPickerOptions([
      { id: 1, name: 'HVAC', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
      { id: 2, name: 'Air Outlets', materialLevelTypeId: 2, parentId: 1, schemaId: 1, isActive: true },
      { id: 3, name: 'Ceiling Diffuser', materialLevelTypeId: 3, parentId: 2, schemaId: 1, isActive: true },
    ]);

    expect(getCategoryPickerDisplayLabel(options[0]!)).toBe('HVAC');
    expect(getCategoryPickerDisplayLabel(options[1]!)).toBe('Air Outlets');
    expect(getCategoryPickerDisplayLabel(options[2]!)).toBe('Ceiling Diffuser');
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

  it('excludes category-name self tags from picker filter tags', () => {
    const options = buildCategoryPickerOptions(
      [
        { id: 1, name: 'HVAC', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
        { id: 2, name: '1 kg', materialLevelTypeId: 2, parentId: 1, schemaId: 1, isActive: true },
        { id: 3, name: '100 L', materialLevelTypeId: 2, parentId: 1, schemaId: 1, isActive: true },
      ],
      [
        { materialNodeId: 1, tagName: 'HVAC' },
        { materialNodeId: 2, tagName: '1 kg' },
        { materialNodeId: 2, tagName: 'HVAC' },
        { materialNodeId: 3, tagName: '100 L' },
        { materialNodeId: 3, tagName: 'HVAC' },
      ],
    );

    expect(options.find((option) => option.id === 2)?.directTagNames).toEqual(['HVAC']);
    expect(options.find((option) => option.id === 3)?.directTagNames).toEqual(['HVAC']);
    expect(collectCategoryPickerAvailableTags(options)).toEqual([{ name: 'HVAC', count: 2 }]);
  });
});
