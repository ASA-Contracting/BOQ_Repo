import { DrizzleBoqReadRepository } from '@/infrastructure/persistence/boq/DrizzleBoqReadRepository';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

export async function GET() {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);

  try {
    const repo = new DrizzleBoqReadRepository();
    const boqs = await repo.listBoqs();
    return apiSuccess(boqs, 'BOQ list retrieved');
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : 'Failed to load BOQs', 500);
  }
}
