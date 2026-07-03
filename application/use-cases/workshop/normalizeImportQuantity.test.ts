import { describe, expect, it } from 'vitest';

import { normalizeImportQuantity } from './normalizeImportQuantity';

describe('normalizeImportQuantity', () => {
  it('accepts plain numeric strings', () => {
    expect(normalizeImportQuantity('33')).toBe('33');
    expect(normalizeImportQuantity('12000')).toBe('12000');
    expect(normalizeImportQuantity('1,234.5')).toBe('1234.5');
  });

  it('rejects non-numeric header-like values', () => {
    expect(normalizeImportQuantity('QTY')).toBeNull();
    expect(normalizeImportQuantity('Quantity')).toBeNull();
  });

  it('extracts leading numbers from suffixed values', () => {
    expect(normalizeImportQuantity('33 No.')).toBe('33');
  });
});
