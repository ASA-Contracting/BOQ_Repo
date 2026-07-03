import type { ApiErrorDto } from "@/application/dto/error";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { Result } from "@/domain/shared/Result";
import { mapDomainErrorToDto } from "@/infrastructure/http/errors/mapDomainErrorToHttp";

export type ActionSuccess<T> = {
  success: true;
  data: T;
};

export type ActionFailure = {
  success: false;
  error: ApiErrorDto;
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function mapUseCaseResult<T>(
  result: Result<T, DomainError>,
): ActionResult<T> {
  if (result.ok) {
    return { success: true, data: result.value };
  }

  return {
    success: false,
    error: mapDomainErrorToDto(result.error),
  };
}

export function actionFailure(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ActionFailure {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

export function unauthorizedActionFailure(): ActionFailure {
  return actionFailure(
    "AUTHORIZATION_ERROR",
    "Authentication is required.",
  );
}
