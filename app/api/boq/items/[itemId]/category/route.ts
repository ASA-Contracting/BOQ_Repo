import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess, requireAuthUserId } from "@/infrastructure/auth/api-auth";
import { DrizzleBoqReadRepository } from "@/infrastructure/persistence/boq/DrizzleBoqReadRepository";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

const updateCategorySchema = z.object({
  materialNodeId: z.number().int().positive().nullable(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const { itemId: itemIdParam } = await context.params;
  const itemId = Number(itemIdParam);
  if (!Number.isFinite(itemId)) {
    return apiError("Invalid item id", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.message, 400);
  }

  try {
    const repo = new DrizzleBoqReadRepository();
    await repo.updateItemMaterialNodeId(itemId, parsed.data.materialNodeId);
    return apiSuccess(
      { itemId, materialNodeId: parsed.data.materialNodeId },
      "Category updated",
    );
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : "Failed to update category", 500);
  }
}
