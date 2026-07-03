import { describe, expect, it } from 'vitest';
import { buildBulkPreview, parseBulkLine, parseBulkText } from './category-bulk-parser';

describe('category-bulk-parser', () => {
  it('parses path separators and inline tags', () => {
    expect(parseBulkLine('Air Handling Units/Chilled Water #hvac')).toEqual({
      path: ['Air Handling Units', 'Chilled Water'],
      tags: ['hvac'],
    });
  });

  it('parses multiline bulk text', () => {
    const rows = parseBulkText('Steel/Rebar\nPlumbing #fire');
    expect(rows).toHaveLength(2);
    expect(rows[1].tags).toEqual(['fire']);
  });

  it('builds preview with duplicate and existing path detection', () => {
    const preview = buildBulkPreview(
      'Steel/Rebar\nSteel/Rebar\nExisting/Path',
      ['Existing / Path']
    );
    expect(preview.createCount).toBe(1);
    expect(preview.existingCount).toBe(1);
    expect(preview.errors.some((error) => error.includes('duplicate'))).toBe(true);
  });
});
