import { NextRequest } from 'next/server';
import {
  createMaterialItemSchema,
  updateMaterialItemSchema,
} from '@/application/classification/dto';
import { getDb } from '@/infrastructure/persistence/db';
import {
  createMaterialItem,
  deleteMaterialItem,
  listMaterialItemsForNodes,
  listMaterialNodesByPurpose,
  updateMaterialItem,
} from '@/infrastructure/persistence/repositories/classification/repository';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';
import { MaterialPurpose } from '@/domain/classification/material-purpose';

export async function GET(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const schemaIdParam = request.nextUrl.searchParams.get('schemaId');
  const schemaId = schemaIdParam ? Number(schemaIdParam) : undefined;
  const db = getDb();
  const nodes = await listMaterialNodesByPurpose(db, MaterialPurpose.SystemOption, schemaId);
  const items = await listMaterialItemsForNodes(
    db,
    nodes.map((node) => node.id)
  );
  return apiSuccess(items, 'Material items retrieved');
}

export async function POST(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = createMaterialItemSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  const db = getDb();
  const row = await createMaterialItem(db, parsed.data);
  return apiSuccess(row, 'Material item created');
}

export async function PUT(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = updateMaterialItemSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  const db = getDb();
  const row = await updateMaterialItem(db, parsed.data.id, parsed.data);
  if (!row) return apiError('Material item not found', 404);
  return apiSuccess(row, 'Material item updated');
}

export async function DELETE(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!Number.isFinite(id)) return apiError('id is required', 400);
  const db = getDb();
  await deleteMaterialItem(db, id);
  return apiSuccess(null, 'Material item deleted');
}
