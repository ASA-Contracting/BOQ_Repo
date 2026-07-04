import { NextRequest } from "next/server";

import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import {
  parsePositiveIntParam,
  v1Error,
  v1Success,
  v1Unauthorized,
  v1ValidationError,
} from "@/infrastructure/http/v1-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const ctx = await resolveRequestContext();
  if (!ctx) return v1Unauthorized();

  const { id } = await context.params;
  const boqId = parsePositiveIntParam(id, "id");
  if (boqId == null) {
    return v1ValidationError("Invalid BOQ id.");
  }

  const result = await getAppServices().boq.getBoqBreakdownUseCase.execute(ctx, { boqId });
  if (!result.ok) {
    return v1Error(result.error);
  }

  return v1Success(result.value);
}
