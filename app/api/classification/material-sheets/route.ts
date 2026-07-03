import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/infrastructure/persistence/db';
import { getSheetByScope, upsertSheet } from '@/infrastructure/persistence/repositories/classification/repository';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

const upsertSheetSchema = z.object({
  schemaId: z.number().int().positive(),
  materialNodeId: z.number().int().positive().nullable(),
  columnsJson: z.string(),
  rowsJson: z.string(),
});

export async function GET(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const schemaId = Number(request.nextUrl.searchParams.get('schemaId'));
  const nodeParam = request.nextUrl.searchParams.get('materialNodeId');
  const materialNodeId = nodeParam === 'null' || !nodeParam ? null : Number(nodeParam);
  if (!Number.isFinite(schemaId)) return apiError('schemaId is required', 400);
  const db = getDb();
  const sheet = await getSheetByScope(db, schemaId, materialNodeId);
  return apiSuccess(sheet, 'Material sheet retrieved');
}

export async function PUT(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = upsertSheetSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  const db = getDb();
  const sheet = await upsertSheet(db, parsed.data);
  return apiSuccess(sheet, 'Material sheet saved');
}
