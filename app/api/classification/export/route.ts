import { NextRequest } from 'next/server';
import { exportCategoryTreeCsv } from '@/application/classification/import-categories';
import { getClassificationState } from '@/application/classification/get-classification-state';
import { getDb } from '@/infrastructure/persistence/db';
import { apiError, requireAuthUserId } from '@/infrastructure/auth/api-auth';

export async function GET(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const schemaIdParam = request.nextUrl.searchParams.get('schemaId');
  const schemaId = schemaIdParam ? Number(schemaIdParam) : undefined;
  const db = getDb();
  const state = await getClassificationState(db, schemaId);
  const csv = exportCategoryTreeCsv(state);
  const suffix = new Date().toISOString().replace(/[:.]/g, '-');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="material-category-tree-${suffix}.csv"`,
    },
  });
}
