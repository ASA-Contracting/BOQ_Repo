import { NextRequest } from "next/server";

import { apiError, apiSuccess, requireAuthUserId } from "@/infrastructure/auth/api-auth";
import { DrizzleBoqReadRepository } from "@/infrastructure/persistence/boq/DrizzleBoqReadRepository";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const { itemId: itemIdParam } = await context.params;
  const itemId = Number(itemIdParam);
  if (!Number.isFinite(itemId)) {
    return apiError("Invalid item id", 400);
  }

  try {
    const repo = new DrizzleBoqReadRepository();
    await repo.deleteBoqItem(itemId);
    return apiSuccess({ itemId }, "Row deleted");
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : "Failed to delete row", 500);
  }
}
