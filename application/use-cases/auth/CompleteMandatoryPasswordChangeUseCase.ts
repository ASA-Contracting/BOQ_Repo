import type { ChangePasswordInput } from "@/application/dto/user/passwordSchema";
import type { IUserAdminRepository } from "@/application/ports/IUserAdminRepository";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { AuthorizationError } from "@/domain/shared/errors/AuthorizationError";
import {
  UserAdminNotConfiguredError,
  UserAdminOperationError,
} from "@/domain/user/errors/UserAdminErrors";
import { err, ok, type Result } from "@/domain/shared/Result";

export type CompleteMandatoryPasswordChangeDependencies = {
  userAdminRepository: IUserAdminRepository | null;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
};

export class CompleteMandatoryPasswordChangeUseCase
  implements IUseCase<ChangePasswordInput, void, DomainError>
{
  constructor(private readonly deps: CompleteMandatoryPasswordChangeDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ChangePasswordInput,
  ): Promise<Result<void, DomainError>> {
    if (!ctx.userId) {
      return err(new AuthorizationError("Authentication is required."));
    }

    if (ctx.mustChangePassword !== true) {
      return err(
        new UserAdminOperationError("This account is not required to change its password."),
      );
    }

    if (!this.deps.userAdminRepository) {
      return err(new UserAdminNotConfiguredError());
    }

    const passwordUpdate = await this.deps.updatePassword(input.newPassword);
    if (passwordUpdate.error) {
      return err(new UserAdminOperationError(passwordUpdate.error));
    }

    try {
      await this.deps.userAdminRepository.clearMustChangePassword(ctx.userId);
      return ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete password change.";
      return err(new UserAdminOperationError(message));
    }
  }
}
