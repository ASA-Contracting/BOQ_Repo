import { NextRequest } from 'next/server';
import { saveSchemaHierarchySchema } from '@/application/classification/dto';
import {
  ConflictError,
  saveSchemaHierarchy,
} from '@/application/classification/save-schema-hierarchy';
import { getDb } from '@/infrastructure/persistence/db';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

type Params = { params: Promise<{ schemaId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const { schemaId: schemaIdRaw } = await params;
  const schemaId = Number(schemaIdRaw);
  if (!Number.isFinite(schemaId)) return apiError('Invalid schemaId', 400);

  const parsed = saveSchemaHierarchySchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  try {
    const db = getDb();
    const maps = await saveSchemaHierarchy(db, schemaId, parsed.data.levels);
    return apiSuccess(maps, 'Material schema saved');
  } catch (error) {
    if (error instanceof ConflictError) return apiError(error.message, 409);
    console.error(error);
    return apiError(error instanceof Error ? error.message : 'Failed to save schema', 500);
  }
}
