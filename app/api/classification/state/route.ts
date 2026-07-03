import { NextRequest } from 'next/server';
import { getClassificationState } from '@/application/classification/get-classification-state';
import { getDb } from '@/infrastructure/persistence/db';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

export async function GET(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);

  const schemaIdParam = request.nextUrl.searchParams.get('schemaId');
  const schemaId = schemaIdParam ? Number(schemaIdParam) : undefined;

  try {
    const db = getDb();
    const state = await getClassificationState(db, schemaId);
    return apiSuccess(state, 'Classification state retrieved');
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : 'Failed to load state', 500);
  }
}
