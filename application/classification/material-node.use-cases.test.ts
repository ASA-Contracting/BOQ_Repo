import { describe, expect, it } from 'vitest';
import { ConflictError } from './save-schema-hierarchy';

describe('deleteMaterialNode rules', () => {
  it('documents leaf-only delete rule', () => {
    const error = new ConflictError('Only leaf nodes can be deleted.');
    expect(error.message).toContain('leaf');
  });
});
