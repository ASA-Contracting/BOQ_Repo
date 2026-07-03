import { NextRequest } from 'next/server';
import { importRequestSchema } from '@/application/classification/dto';
import { importCategories, previewCategoryImport } from '@/application/classification/import-categories';
import { getDb } from '@/infrastructure/persistence/db';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

export async function POST(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = importRequestSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  const db = getDb();
  const result = await previewCategoryImport(db, parsed.data);
  return apiSuccess(result, 'Import preview generated');
}
