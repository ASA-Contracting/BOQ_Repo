import { MaterialPurpose } from '@/domain/classification/material-purpose';
import type { Db } from '@/infrastructure/persistence/db';
import {
  countChildren,
  createMaterialNode,
  deleteMaterialNode,
  findMaterialNodeById,
  findNodeByParentAndName,
  updateMaterialNode,
} from '@/infrastructure/persistence/repositories/classification/repository';
import { ConflictError } from './save-schema-hierarchy';

export { ConflictError } from './save-schema-hierarchy';
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

async function ensureUniqueName(
  db: Db,
  schemaId: number,
  name: string,
  parentId: number | null,
  purpose: number,
  excludeId?: number
) {
  const existing = await findNodeByParentAndName(db, schemaId, parentId, name, purpose);
  if (existing && existing.id !== excludeId) {
    throw new ConflictError(
      `Material node "${name}" already exists under this parent for the given purpose.`
    );
  }
}

async function ensureNoCycle(
  db: Db,
  nodeId: number,
  newParentId: number | null
) {
  if (newParentId == null) return;
  if (newParentId === nodeId) {
    throw new ConflictError('A node cannot be its own parent.');
  }
  let cursor: number | null = newParentId;
  const visited = new Set<number>();
  while (cursor != null && !visited.has(cursor)) {
    visited.add(cursor);
    if (cursor === nodeId) {
      throw new ConflictError('Parent assignment would create a cycle.');
    }
    const parent = await findMaterialNodeById(db, cursor);
    cursor = parent?.parentId ?? null;
  }
}

export async function createMaterialNodeUseCase(
  db: Db,
  input: {
    schemaId: number;
    name: string;
    description?: string;
    parentId?: number | null;
    levelTypeId?: number | null;
    purpose?: number;
    value?: string | null;
    unitId?: number | null;
    createdBy?: string;
  }
) {
  const purpose = input.purpose ?? MaterialPurpose.SystemOption;
  const parentId = input.parentId ?? null;
  await ensureUniqueName(db, input.schemaId, input.name, parentId, purpose);
  if (parentId != null) {
    const parent = await findMaterialNodeById(db, parentId);
    if (!parent) throw new NotFoundError(`Parent node ${parentId} not found`);
  }
  return createMaterialNode(db, {
    schemaId: input.schemaId,
    name: input.name.trim(),
    description: input.description ?? null,
    parentId,
    levelTypeId: input.levelTypeId ?? null,
    purpose,
    value: input.value ?? null,
    unitId: input.unitId ?? null,
    createdBy: input.createdBy,
  });
}

export async function updateMaterialNodeUseCase(
  db: Db,
  input: {
    id: number;
    schemaId: number;
    name: string;
    description?: string;
    parentId?: number | null;
    levelTypeId?: number | null;
    purpose?: number;
    value?: string | null;
    unitId?: number | null;
    isActive: boolean;
  }
) {
  const existing = await findMaterialNodeById(db, input.id);
  if (!existing) throw new NotFoundError(`Material node ${input.id} not found`);

  const purpose = input.purpose ?? existing.purpose;
  const parentId = input.parentId !== undefined ? input.parentId : existing.parentId;
  await ensureUniqueName(db, input.schemaId, input.name, parentId, purpose, input.id);
  await ensureNoCycle(db, input.id, parentId);

  return updateMaterialNode(db, input.id, {
    name: input.name.trim(),
    description: input.description ?? existing.description,
    parentId,
    levelTypeId: input.levelTypeId ?? existing.levelTypeId,
    purpose,
    value: input.value ?? existing.value,
    unitId: input.unitId ?? existing.unitId,
    isActive: input.isActive,
  });
}

export async function deleteMaterialNodeUseCase(db: Db, id: number) {
  const existing = await findMaterialNodeById(db, id);
  if (!existing) throw new NotFoundError(`Material node ${id} not found`);
  const childCount = await countChildren(db, id);
  if (childCount > 0) {
    throw new ConflictError('Only leaf nodes can be deleted.');
  }
  await deleteMaterialNode(db, id);
}
