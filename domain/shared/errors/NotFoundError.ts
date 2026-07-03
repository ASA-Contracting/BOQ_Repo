import { DomainError } from "@/domain/shared/errors/DomainError";

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";

  constructor(resource: string, identifier?: string) {
    super(
      identifier
        ? `${resource} not found: ${identifier}`
        : `${resource} not found.`,
    );
  }
}
