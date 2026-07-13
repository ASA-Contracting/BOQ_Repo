import { NextRequest } from "next/server";

import { listClientsQuerySchema } from "@/application/dto/client/clientDto";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import {
  v1Error,
  v1Success,
  v1Unauthorized,
  v1ValidationError,
} from "@/infrastructure/http/v1-response";

export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext();
  if (!ctx) return v1Unauthorized();

  const parsed = listClientsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return v1ValidationError(parsed.error.message);
  }

  const result = await getAppServices().client.listClientsUseCase.execute(ctx, parsed.data);
  if (!result.ok) {
    return v1Error(result.error);
  }

  return v1Success(result.value.items, {
    page: result.value.page,
    pageSize: result.value.pageSize,
    total: result.value.total,
  });
}
