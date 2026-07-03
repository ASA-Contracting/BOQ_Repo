import { describe, expect, it } from 'vitest';
import { buildMaterialClassificationTreeIndex } from './tree-index';
import type { LevelOptionEntity } from './entities';

const options: LevelOptionEntity[] = [
  { id: 1, name: 'Steel', materialLevelTypeId: 1, parentId: null, schemaId: 1 },
  { id: 2, name: 'Rebar', materialLevelTypeId: 2, parentId: 1, schemaId: 1 },
  { id: 3, name: 'Grade60', materialLevelTypeId: 3, parentId: 2, schemaId: 1 },
];

describe('tree-index', () => {
  it('builds parent/child maps', () => {
    const index = buildMaterialClassificationTreeIndex(options);
    expect(index.childrenByParentId.get(null)?.map((o) => o.id)).toEqual([1]);
    expect(index.childrenByParentId.get(1)?.map((o) => o.id)).toEqual([2]);
  });

  it('builds path labels', () => {
    const index = buildMaterialClassificationTreeIndex(options);
    expect(index.pathLabelById.get(3)).toBe('Steel / Rebar / Grade60');
  });

  it('counts descendants', () => {
    const index = buildMaterialClassificationTreeIndex(options);
    expect(index.descendantIdsById.get(1)).toEqual([2, 3]);
  });
});
