import { NextRequest } from "next/server";

import { updateProjectSchema } from "@/application/dto/project/projectSchema";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import {
  parsePositiveIntParam,
  v1Created,
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
  const projectId = parsePositiveIntParam(id, "id");
  if (projectId == null) {
    return v1ValidationError("Invalid project id.");
  }

  const result = await getAppServices().project.getProjectUseCase.execute(ctx, { projectId });
  if (!result.ok) {
    return v1Error(result.error);
  }

  return v1Success(result.value);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const ctx = await resolveRequestContext();
  if (!ctx) return v1Unauthorized();

  const { id } = await context.params;
  const projectId = parsePositiveIntParam(id, "id");
  if (projectId == null) {
    return v1ValidationError("Invalid project id.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return v1ValidationError("Invalid JSON body.");
  }

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return v1ValidationError(parsed.error.message);
  }

  const result = await getAppServices().project.updateProjectUseCase.execute(ctx, {
    projectId,
    ...parsed.data,
  });
  if (!result.ok) {
    return v1Error(result.error);
  }

  return v1Success(result.value);
}
