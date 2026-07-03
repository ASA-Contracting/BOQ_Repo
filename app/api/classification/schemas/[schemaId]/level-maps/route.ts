import { NextRequest } from 'next/server';
import { getLevelMapsBySchemaId } from '@/application/classification/save-schema-hierarchy';
import { getDb } from '@/infrastructure/persistence/db';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

type Params = { params: Promise<{ schemaId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const { schemaId: schemaIdRaw } = await params;
  const schemaId = Number(schemaIdRaw);
  if (!Number.isFinite(schemaId)) return apiError('Invalid schemaId', 400);
  const db = getDb();
  const maps = await getLevelMapsBySchemaId(db, schemaId);
  return apiSuccess(maps, 'Level maps retrieved');
}
