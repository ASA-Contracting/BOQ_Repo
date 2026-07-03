import type { ApiErrorResponseDto } from "@/application/dto/error";
import { DomainError } from "@/domain/shared/errors/DomainError";
import {
  mapDomainErrorToDto,
  mapDomainErrorToHttpStatus,
  mapUnknownErrorToDto,
  mapUnknownErrorToHttpStatus,
} from "@/infrastructure/http/errors/mapDomainErrorToHttp";
import type { ILogger } from "@/application/ports/ILogger";

export function createErrorResponse(
  error: unknown,
  logger?: ILogger,
  context?: { correlationId?: string; userId?: string },
): { body: ApiErrorResponseDto; status: number } {
  const body: ApiErrorResponseDto = {
    error: error instanceof DomainError ? mapDomainErrorToDto(error) : mapUnknownErrorToDto(error),
  };

  const status =
    error instanceof DomainError
      ? mapDomainErrorToHttpStatus(error)
      : mapUnknownErrorToHttpStatus(error);

  logger?.error(body.error.message, context, error);

  return { body, status };
}

export function createJsonErrorResponse(
  error: unknown,
  logger?: ILogger,
  context?: { correlationId?: string; userId?: string },
): Response {
  const { body, status } = createErrorResponse(error, logger, context);
  return Response.json(body, { status });
}
