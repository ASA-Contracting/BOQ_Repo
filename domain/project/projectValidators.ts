import {
  PROJECT_CLIENT_MAX_LENGTH,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from "@/domain/project/constants";
import { err, ok, type Result } from "@/domain/shared/Result";
import { ValidationError } from "@/domain/shared/errors/ValidationError";

export function validateProjectName(name: string): Result<string, ValidationError> {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return err(new ValidationError("Project name is required.", { field: "name" }));
  }

  if (trimmed.length > PROJECT_NAME_MAX_LENGTH) {
    return err(
      new ValidationError(
        `Project name must not exceed ${PROJECT_NAME_MAX_LENGTH} characters.`,
        { field: "name", maxLength: PROJECT_NAME_MAX_LENGTH },
      ),
    );
  }

  return ok(trimmed);
}

export function validateProjectClient(client: string): Result<string, ValidationError> {
  const trimmed = client.trim();

  if (trimmed.length === 0) {
    return err(new ValidationError("Client is required.", { field: "client" }));
  }

  if (trimmed.length > PROJECT_CLIENT_MAX_LENGTH) {
    return err(
      new ValidationError(
        `Client must not exceed ${PROJECT_CLIENT_MAX_LENGTH} characters.`,
        { field: "client", maxLength: PROJECT_CLIENT_MAX_LENGTH },
      ),
    );
  }

  return ok(trimmed);
}

export function validateProjectDescription(
  description: string | null | undefined,
): Result<string | null, ValidationError> {
  if (description == null || description.trim().length === 0) {
    return ok(null);
  }

  const trimmed = description.trim();

  if (trimmed.length > PROJECT_DESCRIPTION_MAX_LENGTH) {
    return err(
      new ValidationError(
        `Description must not exceed ${PROJECT_DESCRIPTION_MAX_LENGTH} characters.`,
        { field: "description", maxLength: PROJECT_DESCRIPTION_MAX_LENGTH },
      ),
    );
  }

  return ok(trimmed);
}
