import type { Db } from '@/infrastructure/persistence/db';
import { findLevelMapsBySchemaId, replaceLevelMapsForSchema } from '@/infrastructure/persistence/repositories/classification/repository';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export async function saveSchemaHierarchy(
  db: Db,
  schemaId: number,
  levels: Array<{ levelTypeId: number; order: number; isRequired: boolean }>
) {
  const orders = levels.map((l) => l.order).sort((a, b) => a - b);
  const expected = Array.from({ length: orders.length }, (_, i) => i + 1);
  if (orders.length === 0 || !orders.every((o, i) => o === expected[i])) {
    throw new ConflictError('Invalid level order sequence');
  }

  const levelTypeIds = levels.map((l) => l.levelTypeId);
  if (new Set(levelTypeIds).size !== levelTypeIds.length) {
    throw new ConflictError('Duplicate level types are not allowed');
  }

  return replaceLevelMapsForSchema(db, schemaId, levels);
}

export async function getLevelMapsBySchemaId(db: Db, schemaId: number) {
  return findLevelMapsBySchemaId(db, schemaId);
}
