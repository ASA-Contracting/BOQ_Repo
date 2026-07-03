import { describe, expect, it } from 'vitest';
import {
  buildCodeFromPath,
  buildPathIds,
  normalizeToken,
  parsePathIds,
} from './classification-policy';

describe('classification-policy', () => {
  it('normalizes tokens', () => {
    expect(normalizeToken('Steel Rebar 12mm')).toBe('STEELREBAR12MM');
  });

  it('parses comma-separated path ids', () => {
    expect(parsePathIds('1,2,3')).toEqual([1, 2, 3]);
  });

  it('builds path ids string', () => {
    expect(buildPathIds([1, 2, 3])).toBe('1,2,3');
  });

  it('builds code from path', () => {
    const code = buildCodeFromPath({
      levels: [
        { levelTypeId: 1, order: 1, isRequired: true },
        { levelTypeId: 2, order: 2, isRequired: true },
      ],
      levelTypes: [
        { id: 1, name: 'Discipline', prefix: 'D', suffix: '', isNumeric: false },
        { id: 2, name: 'System', prefix: 'S', suffix: '', isNumeric: false },
      ],
      options: [
        { id: 10, name: 'Steel', materialLevelTypeId: 1, parentId: null, schemaId: 1 },
        { id: 20, name: 'Rebar', materialLevelTypeId: 2, parentId: 10, schemaId: 1 },
      ],
      pathIds: [10, 20],
    });
    expect(code).toBe('DSTEEL-SREBAR');
  });

  it('returns empty code when required level missing', () => {
    const code = buildCodeFromPath({
      levels: [{ levelTypeId: 1, order: 1, isRequired: true }],
      levelTypes: [{ id: 1, name: 'Discipline', isNumeric: false }],
      options: [],
      pathIds: [],
    });
    expect(code).toBe('');
  });
});
