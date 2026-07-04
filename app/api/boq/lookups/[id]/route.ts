import { NextRequest } from "next/server";

import type {
  DeleteBoqLookupOptionInput,
  UpdateBoqLookupOptionInput,
} from "@/application/dto/boq/boqLookupOptionDto";
import { apiError, apiSuccess } from "@/infrastructure/auth/api-auth";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

function mapUseCaseError(code: string, message: string) {
  if (code === "UNAUTHORIZED") return apiError(message, 403);
  if (code === "NOT_FOUND") return apiError(message, 404);
  return apiError(message, 400);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return apiError("Invalid lookup option id", 400);
  }

  let body: Omit<UpdateBoqLookupOptionInput, "id">;
  try {
    body = (await request.json()) as Omit<UpdateBoqLookupOptionInput, "id">;
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const result = await getAppServices().boq.updateBoqLookupOptionUseCase.execute(ctx, {
    ...body,
    id,
  });

  if (!result.ok) {
    return mapUseCaseError(result.error.code, result.error.message);
  }

  return apiSuccess(result.value, "BOQ lookup option updated");
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return apiError("Invalid lookup option id", 400);
  }

  const payload: DeleteBoqLookupOptionInput = { id };
  const result = await getAppServices().boq.deleteBoqLookupOptionUseCase.execute(ctx, payload);

  if (!result.ok) {
    return mapUseCaseError(result.error.code, result.error.message);
  }

  return apiSuccess(null, "BOQ lookup option deleted");
}
