import { DomainError } from "@/domain/shared/errors/DomainError";

import type { ProjectId } from "@/domain/project/ids";

export class ProjectNotFoundError extends DomainError {
  readonly code = "PROJECT_NOT_FOUND";

  constructor(readonly projectId: ProjectId) {
    super(`Project not found: ${projectId}`);
  }
}

export class ProjectClosedError extends DomainError {
  readonly code = "PROJECT_CLOSED";

  constructor(readonly projectId: ProjectId) {
    super(`Project ${projectId} is closed and cannot be modified.`);
  }
}

export class ProjectAlreadyClosedError extends DomainError {
  readonly code = "PROJECT_ALREADY_CLOSED";

  constructor(readonly projectId: ProjectId) {
    super(`Project ${projectId} is already closed.`);
  }
}
