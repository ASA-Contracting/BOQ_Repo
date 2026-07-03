import { NextRequest } from 'next/server';
import {
  createLevelTypeSchema,
  updateLevelTypeSchema,
} from '@/application/classification/dto';
import { getDb } from '@/infrastructure/persistence/db';
import {
  createLevelType,
  deleteLevelType,
  listLevelTypes,
  updateLevelType,
} from '@/infrastructure/persistence/repositories/classification/repository';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

export async function GET() {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const db = getDb();
  const rows = await listLevelTypes(db);
  return apiSuccess(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      suffix: row.suffix,
      isNumeric: row.isNumeric,
      standardUnitId: row.standardUnitId,
      isActive: row.isActive,
    })),
    'Level types retrieved'
  );
}

export async function POST(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = createLevelTypeSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  const db = getDb();
  const row = await createLevelType(db, parsed.data);
  return apiSuccess(row, 'Level type created');
}

export async function PUT(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = updateLevelTypeSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  const db = getDb();
  const row = await updateLevelType(db, parsed.data.id, parsed.data);
  if (!row) return apiError('Level type not found', 404);
  return apiSuccess(row, 'Level type updated');
}

export async function DELETE(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!Number.isFinite(id)) return apiError('id is required', 400);
  const db = getDb();
  await deleteLevelType(db, id);
  return apiSuccess(null, 'Level type deleted');
}
