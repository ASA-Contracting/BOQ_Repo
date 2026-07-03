import { NextRequest } from 'next/server';
import {
  createMaterialNodeSchema,
  updateMaterialNodeSchema,
} from '@/application/classification/dto';
import {
  ConflictError,
  createMaterialNodeUseCase,
  deleteMaterialNodeUseCase,
  NotFoundError,
  updateMaterialNodeUseCase,
} from '@/application/classification/material-node.use-cases';
import { getDb } from '@/infrastructure/persistence/db';
import {
  findMaterialNodeById,
  listMaterialNodesByPurpose,
} from '@/infrastructure/persistence/repositories/classification/repository';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';
import { MaterialPurpose } from '@/domain/classification/material-purpose';

export async function GET(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const purpose = Number(request.nextUrl.searchParams.get('purpose') ?? MaterialPurpose.SystemOption);
  const schemaIdParam = request.nextUrl.searchParams.get('schemaId');
  const schemaId = schemaIdParam ? Number(schemaIdParam) : undefined;
  const db = getDb();
  const rows = await listMaterialNodesByPurpose(db, purpose, schemaId);
  return apiSuccess(rows, 'Materials retrieved');
}

export async function POST(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = createMaterialNodeSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  try {
    const db = getDb();
    const row = await createMaterialNodeUseCase(db, { ...parsed.data, createdBy: userId });
    const dto = await findMaterialNodeById(db, row.id);
    return apiSuccess(dto, 'Material option created');
  } catch (error) {
    if (error instanceof ConflictError) return apiError(error.message, 409);
    if (error instanceof NotFoundError) return apiError(error.message, 404);
    throw error;
  }
}

export async function PUT(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = updateMaterialNodeSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  try {
    const db = getDb();
    await updateMaterialNodeUseCase(db, parsed.data);
    const dto = await findMaterialNodeById(db, parsed.data.id);
    return apiSuccess(dto, 'Material updated');
  } catch (error) {
    if (error instanceof ConflictError) return apiError(error.message, 409);
    if (error instanceof NotFoundError) return apiError(error.message, 404);
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!Number.isFinite(id)) return apiError('id is required', 400);
  try {
    const db = getDb();
    await deleteMaterialNodeUseCase(db, id);
    return apiSuccess(null, 'Material deleted');
  } catch (error) {
    if (error instanceof ConflictError) return apiError(error.message, 409);
    if (error instanceof NotFoundError) return apiError(error.message, 404);
    throw error;
  }
}
