import { describe, expect, it } from 'vitest';
import { saveSchemaHierarchy, ConflictError } from './save-schema-hierarchy';

describe('saveSchemaHierarchy validation', () => {
  it('rejects invalid order sequence', async () => {
    const db = {} as never;
    await expect(
      saveSchemaHierarchy(db, 1, [
        { levelTypeId: 1, order: 1, isRequired: true },
        { levelTypeId: 2, order: 3, isRequired: true },
      ])
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects duplicate level types', async () => {
    const db = {} as never;
    await expect(
      saveSchemaHierarchy(db, 1, [
        { levelTypeId: 1, order: 1, isRequired: true },
        { levelTypeId: 1, order: 2, isRequired: true },
      ])
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
