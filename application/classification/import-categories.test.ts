import { describe, expect, it } from 'vitest';
import { buildImportPathKey } from './import-categories.helpers';

describe('import path key', () => {
  it('normalizes path segments', () => {
    expect(buildImportPathKey(['Steel', 'Rebar'])).toBe('STEEL>REBAR');
  });
});
