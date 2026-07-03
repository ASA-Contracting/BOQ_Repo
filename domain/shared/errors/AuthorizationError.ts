import { DomainError } from "@/domain/shared/errors/DomainError";

export class AuthorizationError extends DomainError {
  readonly code = "AUTHORIZATION_ERROR";

  constructor(message = "You do not have permission to perform this action.") {
    super(message);
  }
}
