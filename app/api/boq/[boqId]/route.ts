import { NextRequest } from 'next/server';

import { DrizzleBoqReadRepository } from '@/infrastructure/persistence/boq/DrizzleBoqReadRepository';
import { apiError, apiSuccess, requireAuthUserId } from '@/infrastructure/auth/api-auth';

type RouteContext = {
  params: Promise<{ boqId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError('Unauthorized', 401);

  const { boqId: boqIdParam } = await context.params;
  const boqId = Number(boqIdParam);
  if (!Number.isFinite(boqId)) {
    return apiError('Invalid BOQ id', 400);
  }

  try {
    const repo = new DrizzleBoqReadRepository();
    const breakdown = await repo.getBoqBreakdown(boqId);
    if (!breakdown) {
      return apiError('BOQ not found', 404);
    }
    return apiSuccess(breakdown, 'BOQ breakdown retrieved');
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : 'Failed to load BOQ', 500);
  }
}
