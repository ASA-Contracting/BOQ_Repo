import type { DomainError } from "@/domain/shared/errors/DomainError";

export type V1Meta = {
  page?: number;
  pageSize?: number;
  total?: number;
};

export type V1ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export function v1Success<T>(data: T, meta?: V1Meta, status = 200): Response {
  return Response.json({ data, ...(meta ? { meta } : {}) }, { status });
}

export function v1Created<T>(data: T): Response {
  return v1Success(data, undefined, 201);
}

export function v1Error(error: DomainError | { code: string; message: string }, status?: number): Response {
  const resolvedStatus = status ?? domainErrorStatus(error.code);
  const body: V1ErrorBody = {
    error: {
      code: error.code,
      message: error.message,
      ...("details" in error && error.details
        ? { details: error.details as Record<string, unknown> }
        : {}),
    },
  };

  return Response.json(body, { status: resolvedStatus });
}

export function v1Unauthorized(): Response {
  return Response.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required.",
      },
    },
    { status: 401 },
  );
}

export function v1ValidationError(message: string, details?: Record<string, unknown>): Response {
  return Response.json(
    {
      error: {
        code: "VALIDATION_ERROR",
        message,
        ...(details ? { details } : {}),
      },
    },
    { status: 400 },
  );
}

function domainErrorStatus(code: string): number {
  switch (code) {
    case "AUTHORIZATION_ERROR":
      return 403;
    case "PROJECT_NOT_FOUND":
    case "FAMILY_NOT_FOUND":
    case "WORKSHOP_BATCH_NOT_FOUND":
      return 404;
    case "PROJECT_CLOSED":
    case "PROJECT_ALREADY_CLOSED":
    case "WORKSHOP_EMPTY_BOQ":
    case "WORKSHOP_NOTHING_TO_PUBLISH":
    case "WORKSHOP_PUBLISH_NOT_COMPLETE":
    case "VALIDATION_ERROR":
      return 422;
    case "USER_NOT_FOUND":
      return 404;
    case "USER_ADMIN_NOT_CONFIGURED":
    case "LAST_SYSTEM_ADMINISTRATOR":
    case "CANNOT_DELETE_SELF":
    case "USER_ADMIN_OPERATION_ERROR":
      return 422;
    default:
      return 400;
  }
}

export function parsePositiveIntParam(value: string, field: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
