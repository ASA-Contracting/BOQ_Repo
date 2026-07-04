import { NextRequest } from 'next/server';
import { bulkMaterialTagSchema } from '@/application/classification/dto';
import { getDb, resetDbAfterError } from '@/infrastructure/persistence/db';
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
  try {
    const db = getDb();
    const count = await bulkAssignTags(db, parsed.data.materialNodeIds, parsed.data.tagId);
    return apiSuccess({ assignedCount: count }, 'Tags assigned');
  } catch (error) {
    resetDbAfterError(error);
    console.error(error);
    return apiError(error instanceof Error ? error.message : 'Failed to assign tags', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = bulkMaterialTagSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  try {
    const db = getDb();
    await bulkRemoveTags(db, parsed.data.materialNodeIds, parsed.data.tagId);
    return apiSuccess(null, 'Tags removed');
  } catch (error) {
    resetDbAfterError(error);
    console.error(error);
    return apiError(error instanceof Error ? error.message : 'Failed to remove tags', 500);
  }
}
