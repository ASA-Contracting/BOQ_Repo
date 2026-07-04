import { NextRequest } from 'next/server';
import { createTagSchema, updateTagSchema } from '@/application/classification/dto';
import { getDb, resetDbAfterError } from '@/infrastructure/persistence/db';
import { isPostgresUniqueViolation } from '@/infrastructure/persistence/postgres-errors';
import { createTag, deleteTag, listTags, updateTag } from '@/infrastructure/persistence/repositories/classification/repository';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

export async function GET() {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const db = getDb();
  const rows = await listTags(db);
  return apiSuccess(rows, 'Tags retrieved');
}

export async function POST(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = createTagSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  try {
    const db = getDb();
    const row = await createTag(db, parsed.data.name, parsed.data.color ?? null);
    return apiSuccess(row, 'Tag created');
  } catch (error) {
    resetDbAfterError(error);
    if (isPostgresUniqueViolation(error)) {
      return apiError('A tag with this name already exists', 409);
    }
    console.error(error);
    return apiError(error instanceof Error ? error.message : 'Failed to create tag', 500);
  }
}

export async function PUT(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = updateTagSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  try {
    const db = getDb();
    const row = await updateTag(db, parsed.data.id, {
      name: parsed.data.name,
      color: parsed.data.color ?? null,
    });
    if (!row) return apiError('Tag not found', 404);
    return apiSuccess(row, 'Tag updated');
  } catch (error) {
    resetDbAfterError(error);
    if (isPostgresUniqueViolation(error)) {
      return apiError('A tag with this name already exists', 409);
    }
    console.error(error);
    return apiError(error instanceof Error ? error.message : 'Failed to update tag', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!Number.isFinite(id)) return apiError('id is required', 400);
  try {
    const db = getDb();
    await deleteTag(db, id);
    return apiSuccess(null, 'Tag deleted');
  } catch (error) {
    resetDbAfterError(error);
    console.error(error);
    return apiError(error instanceof Error ? error.message : 'Failed to delete tag', 500);
  }
}
