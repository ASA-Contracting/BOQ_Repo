import { AuthorizationError } from "@/domain/shared/errors/AuthorizationError";
import { DomainError } from "@/domain/shared/errors/DomainError";
import { InfrastructureError } from "@/domain/shared/errors/InfrastructureError";
import { NotFoundError } from "@/domain/shared/errors/NotFoundError";
import { ValidationError } from "@/domain/shared/errors/ValidationError";
import {
  CircularParentError,
  DuplicateSiblingNameError,
  FamilyHasChildrenError,
  FamilyLevelTypeNotFoundError,
  FamilyNotFoundError,
  FamilyReferencedError,
} from "@/domain/family/errors/FamilyErrors";
import {
  WorkshopBatchNotFoundError,
  WorkshopImportNoRowsError,
  WorkshopItemNotFoundError,
  WorkshopQueueEmptyError,
} from "@/domain/workshop/errors/WorkshopErrors";
import type { ApiErrorDto } from "@/application/dto/error";

export function mapDomainErrorToHttpStatus(error: DomainError): number {
  if (error instanceof AuthorizationError) {
    return 403;
  }

  if (
    error instanceof NotFoundError ||
    error instanceof FamilyNotFoundError ||
    error instanceof FamilyLevelTypeNotFoundError ||
    error instanceof WorkshopBatchNotFoundError ||
    error instanceof WorkshopItemNotFoundError
  ) {
    return 404;
  }

  if (error instanceof WorkshopQueueEmptyError) {
    return 404;
  }

  if (
    error instanceof ValidationError ||
    error instanceof WorkshopImportNoRowsError
  ) {
    return 400;
  }

  if (
    error instanceof CircularParentError ||
    error instanceof DuplicateSiblingNameError ||
    error instanceof FamilyHasChildrenError ||
    error instanceof FamilyReferencedError
  ) {
    return 409;
  }

  if (error instanceof InfrastructureError) {
    return 503;
  }

  return 500;
}

export function mapDomainErrorToDto(error: DomainError): ApiErrorDto {
  return {
    code: error.code,
    message: error.message,
    ...(error instanceof ValidationError && error.details
      ? { details: error.details }
      : {}),
  };
}

export function mapUnknownErrorToDto(error: unknown): ApiErrorDto {
  if (error instanceof DomainError) {
    return mapDomainErrorToDto(error);
  }

  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
  };
}

export function mapUnknownErrorToHttpStatus(error: unknown): number {
  if (error instanceof DomainError) {
    return mapDomainErrorToHttpStatus(error);
  }

  return 500;
}
