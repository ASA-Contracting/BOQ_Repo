import { DomainError } from "@/domain/shared/errors/DomainError";

export class InfrastructureError extends DomainError {
  readonly code = "INFRASTRUCTURE_ERROR";

  constructor(message: string) {
    super(message);
  }
}
