import { NextRequest } from 'next/server';
import { getClassificationState } from '@/application/classification/get-classification-state';
import { getDb, resetDbAfterError } from '@/infrastructure/persistence/db';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

export async function GET(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);

  const schemaIdParam = request.nextUrl.searchParams.get('schemaId');
  const schemaId = schemaIdParam ? Number(schemaIdParam) : undefined;
  const lite = request.nextUrl.searchParams.get('lite') === '1';

  try {
    const db = getDb();
    const state = await getClassificationState(db, schemaId, { lite });
    return apiSuccess(state, 'Classification state retrieved');
  } catch (error) {
    resetDbAfterError(error);
    console.error(error);
    return apiError(error instanceof Error ? error.message : 'Failed to load state', 500);
  }
}
