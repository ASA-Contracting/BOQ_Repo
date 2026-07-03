import { NextRequest } from 'next/server';
import { getDb } from '@/infrastructure/persistence/db';
import {
  createSchema,
  listSchemas,
} from '@/infrastructure/persistence/repositories/classification/repository';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';
import { z } from 'zod';

const createSchemaBody = z.object({ name: z.string().min(1).max(150) });

export async function GET() {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const db = getDb();
  const rows = await listSchemas(db);
  return apiSuccess(rows, 'Schemas retrieved');
}

export async function POST(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);
  const parsed = createSchemaBody.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);
  const db = getDb();
  const row = await createSchema(db, parsed.data.name, userId);
  return apiSuccess(row, 'Schema created');
}
