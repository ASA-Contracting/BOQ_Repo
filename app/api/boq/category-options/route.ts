import { NextRequest } from "next/server";

import { getClassificationState } from "@/application/classification/get-classification-state";
import { apiError, apiSuccess, requireAuthUserId } from "@/infrastructure/auth/api-auth";
import { getDb } from "@/infrastructure/persistence/db";
import { buildCategoryPickerOptions } from "@/lib/category-picker-options";

export async function GET(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const schemaIdParam = request.nextUrl.searchParams.get("schemaId");
  const schemaId = schemaIdParam ? Number(schemaIdParam) : undefined;

  try {
    const db = getDb();
    const state = await getClassificationState(db, schemaId);
    const options = buildCategoryPickerOptions(
      state.materials
        .filter((material) => material.isActive)
        .map((material) => ({
          id: material.id,
          name: material.name,
          materialLevelTypeId: material.levelTypeId,
          parentId: material.parentId,
          schemaId: material.schemaId,
          isActive: material.isActive,
        })),
    );
    return apiSuccess(
      {
        schemaId: state.schemaId,
        options,
      },
      "Category picker options retrieved",
    );
  } catch (error) {
    console.error(error);
    return apiError(
      error instanceof Error ? error.message : "Failed to load category options",
      500,
    );
  }
}
