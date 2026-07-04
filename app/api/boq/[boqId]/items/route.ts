import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess, requireAuthUserId } from "@/infrastructure/auth/api-auth";
import { DrizzleBoqReadRepository } from "@/infrastructure/persistence/boq/DrizzleBoqReadRepository";

type RouteContext = {
  params: Promise<{ boqId: string }>;
};

const insertItemSchema = z.object({
  relativeToItemId: z.number().int().positive(),
  position: z.enum(["before", "after"]),
  versionId: z.number().int().positive().nullable().optional(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const { boqId: boqIdParam } = await context.params;
  const boqId = Number(boqIdParam);
  if (!Number.isFinite(boqId)) {
    return apiError("Invalid BOQ id", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = insertItemSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.message, 400);
  }

  try {
    const repo = new DrizzleBoqReadRepository();
    const breakdown = await repo.getBoqBreakdown(boqId);
    if (!breakdown) {
      return apiError("BOQ not found", 404);
    }

    const item = await repo.insertBoqItem({
      boqId,
      versionId: parsed.data.versionId ?? breakdown.versionId,
      relativeToItemId: parsed.data.relativeToItemId,
      position: parsed.data.position,
    });

    return apiSuccess(item, "Row inserted");
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : "Failed to insert row", 500);
  }
}
