import { NextRequest } from "next/server";

import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import {
  v1Created,
  v1Error,
  v1Unauthorized,
} from "@/infrastructure/http/v1-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  const ctx = await resolveRequestContext();
  if (!ctx) return v1Unauthorized();

  const { id } = await context.params;

  const result = await getAppServices().userAdmin.resetUserPasswordUseCase.execute(
    ctx,
    { id },
  );
  if (!result.ok) {
    return v1Error(result.error);
  }

  return v1Created(result.value);
}
