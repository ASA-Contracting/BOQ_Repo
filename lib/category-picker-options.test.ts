import { describe, expect, it } from 'vitest';

import { buildCategoryPickerOptions, filterCategoryPickerOptions } from './category-picker-options';

describe('category-picker-options', () => {
  it('builds hierarchical paths for picker options', () => {
    const options = buildCategoryPickerOptions([
      { id: 1, name: 'Mechanical', materialLevelTypeId: 1, parentId: null, schemaId: 1, isActive: true },
      { id: 2, name: 'AHU', materialLevelTypeId: 2, parentId: 1, schemaId: 1, isActive: true },
    ]);

    expect(options).toHaveLength(2);
    expect(options.find((option) => option.id === 2)?.path).toBe('Mechanical / AHU');
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
});
