import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess, requireAuthUserId } from "@/infrastructure/auth/api-auth";
import { DrizzleBoqReadRepository } from "@/infrastructure/persistence/boq/DrizzleBoqReadRepository";

type RouteContext = {
  params: Promise<{ boqId: string }>;
};

const updateDisciplineSchema = z.object({
  versionId: z.number().int().positive(),
  batchId: z.number().int().positive().optional(),
  discipline: z.string().trim().min(1).max(150),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const { boqId: boqIdParam } = await context.params;
  const boqId = Number(boqIdParam);
  if (!Number.isFinite(boqId) || boqId <= 0) {
    return apiError("Invalid BOQ id", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = updateDisciplineSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.message, 400);
  }

  const repo = new DrizzleBoqReadRepository();

  const versionBelongsToBoq = await repo.versionBelongsToBoq(boqId, parsed.data.versionId);
  if (!versionBelongsToBoq) {
    return apiError("BOQ version not found for this breakdown.", 404);
  }

  const isApproved = await repo.isVersionApproved(parsed.data.versionId);
  if (isApproved) {
    return apiError("Discipline cannot be changed on an approved version.", 403);
  }

  if (parsed.data.batchId != null) {
    const batchBelongsToBoq = await repo.batchBelongsToBoq(boqId, parsed.data.batchId);
    if (!batchBelongsToBoq) {
      return apiError("BOQ batch not found for this breakdown.", 404);
    }
  }

  try {
    await repo.updateVersionDiscipline(parsed.data.versionId, parsed.data.discipline);

    if (parsed.data.batchId != null) {
      await repo.updateBatchDiscipline(parsed.data.batchId, parsed.data.discipline);
    }

    return apiSuccess({ discipline: parsed.data.discipline }, "Discipline updated");
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : "Failed to update discipline", 500);
  }
}
