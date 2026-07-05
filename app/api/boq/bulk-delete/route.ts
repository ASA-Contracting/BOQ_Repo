import { NextRequest } from "next/server";

import type { DeleteBoqMasterListEntriesInput } from "@/application/use-cases/boq/DeleteBoqMasterListEntriesUseCase";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import { apiError, apiSuccess } from "@/infrastructure/auth/api-auth";

export async function POST(request: NextRequest) {
  const ctx = await resolveRequestContext();
  if (!ctx) return apiError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const result = await getAppServices().boq.deleteBoqMasterListEntriesUseCase.execute(
    ctx,
    body as DeleteBoqMasterListEntriesInput,
  );
  if (!result.ok) {
    const status =
      result.error.code === "AUTHORIZATION_ERROR"
        ? 403
        : result.error.code === "NOT_FOUND"
          ? 404
          : 400;
    return apiError(result.error.message, status);
  }

  return apiSuccess(result.value, "Selected BOQs deleted");
}
