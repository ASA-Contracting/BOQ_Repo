import { NextRequest } from 'next/server';
import { bulkMaterialTagSchema } from '@/application/classification/dto';
import { getDb } from '@/infrastructure/persistence/db';
import {
  bulkAssignTags,
  bulkRemoveTags,
} from '@/infrastructure/persistence/repositories/classification/repository';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

export async function POST(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = bulkMaterialTagSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  const db = getDb();
  const count = await bulkAssignTags(db, parsed.data.materialNodeIds, parsed.data.tagId);
  return apiSuccess({ assignedCount: count }, 'Tags assigned');
}

export async function DELETE(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = bulkMaterialTagSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  const db = getDb();
  await bulkRemoveTags(db, parsed.data.materialNodeIds, parsed.data.tagId);
  return apiSuccess(null, 'Tags removed');
}
