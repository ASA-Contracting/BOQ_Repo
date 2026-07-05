import { DomainError } from "@/domain/shared/errors/DomainError";

export class UserAdminNotConfiguredError extends DomainError {
  readonly code = "USER_ADMIN_NOT_CONFIGURED";

  constructor() {
    super(
      "User administration requires SUPABASE_SECRET_KEY. Configure it in .env.local.",
    );
  }
}

export class UserNotFoundError extends DomainError {
  readonly code = "USER_NOT_FOUND";

  constructor(userId: string) {
    super(`User "${userId}" was not found.`);
  }
}

export class LastSystemAdministratorError extends DomainError {
  readonly code = "LAST_SYSTEM_ADMINISTRATOR";

  constructor() {
    super(
      "At least one active System Administrator is required. Assign another administrator before removing this role.",
    );
  }
}

export class CannotDeleteSelfError extends DomainError {
  readonly code = "CANNOT_DELETE_SELF";

  constructor() {
    super("You cannot delete your own account.");
  }
}
