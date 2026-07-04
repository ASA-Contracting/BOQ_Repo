import { NextRequest } from 'next/server';
import { importRequestSchema } from '@/application/classification/dto';
import { importCategories } from '@/application/classification/import-categories';
import { getDb, resetDbAfterError } from '@/infrastructure/persistence/db';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

export async function POST(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = importRequestSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  try {
    const db = getDb();
    const result = await importCategories(db, parsed.data);
    if (result.issues.some((issue) => issue.severity === 'error')) {
      return apiError('Import failed validation', 400);
    }
    return apiSuccess(result, 'Categories imported');
  } catch (error) {
    resetDbAfterError(error);
    console.error(error);
    return apiError(error instanceof Error ? error.message : 'Import failed', 500);
  }
}
