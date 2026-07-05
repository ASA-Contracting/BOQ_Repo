import { NextRequest } from "next/server";

import { updateUserSchema } from "@/application/dto/user/userSchema";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import {
  v1Error,
  v1Success,
  v1Unauthorized,
  v1ValidationError,
} from "@/infrastructure/http/v1-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const ctx = await resolveRequestContext();
  if (!ctx) return v1Unauthorized();

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return v1ValidationError("Invalid JSON body.");
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return v1ValidationError(parsed.error.message);
  }

  const result = await getAppServices().userAdmin.updateUserUseCase.execute(ctx, {
    id,
    ...parsed.data,
  });
  if (!result.ok) {
    return v1Error(result.error);
  }

  return v1Success(result.value);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const ctx = await resolveRequestContext();
  if (!ctx) return v1Unauthorized();

  const { id } = await context.params;

  const result = await getAppServices().userAdmin.deleteUserUseCase.execute(ctx, {
    id,
  });
  if (!result.ok) {
    return v1Error(result.error);
  }

  return v1Success(null);
}
