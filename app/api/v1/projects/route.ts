import { NextRequest } from "next/server";
import { z } from "zod";

import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from "@/application/dto/project/projectSchema";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import {
  v1Created,
  v1Error,
  v1Success,
  v1Unauthorized,
  v1ValidationError,
} from "@/infrastructure/http/v1-response";

export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext();
  if (!ctx) return v1Unauthorized();

  const parsed = listProjectsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return v1ValidationError(parsed.error.message);
  }

  const result = await getAppServices().project.listProjectsUseCase.execute(ctx, parsed.data);
  if (!result.ok) {
    return v1Error(result.error);
  }

  return v1Success(result.value.items, {
    page: result.value.page,
    pageSize: result.value.pageSize,
    total: result.value.total,
  });
}

export async function POST(request: NextRequest) {
  const ctx = await resolveRequestContext();
  if (!ctx) return v1Unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return v1ValidationError("Invalid JSON body.");
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return v1ValidationError(parsed.error.message);
  }

  const result = await getAppServices().project.createProjectUseCase.execute(ctx, parsed.data);
  if (!result.ok) {
    return v1Error(result.error);
  }

  return v1Created(result.value);
}
