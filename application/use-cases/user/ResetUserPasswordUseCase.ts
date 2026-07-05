import type { UserWithTemporaryPasswordDto } from "@/application/dto/user/userDto";
import { mapAdminUserWithTemporaryPasswordDto } from "@/application/mappers/user/userMapper";
import type { IUserAdminRepository } from "@/application/ports/IUserAdminRepository";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeUserAdmin } from "@/application/use-cases/user/authorizeUserAdmin";
import {
  UserAdminNotConfiguredError,
  UserAdminOperationError,
} from "@/domain/user/errors/UserAdminErrors";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type ResetUserPasswordInput = {
  id: string;
};

export type ResetUserPasswordDependencies = {
  userAdminRepository: IUserAdminRepository | null;
};

export class ResetUserPasswordUseCase
  implements IUseCase<ResetUserPasswordInput, UserWithTemporaryPasswordDto, DomainError>
{
  constructor(private readonly deps: ResetUserPasswordDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ResetUserPasswordInput,
  ): Promise<Result<UserWithTemporaryPasswordDto, DomainError>> {
    const auth = authorizeUserAdmin(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!this.deps.userAdminRepository) {
      return err(new UserAdminNotConfiguredError());
    }

    try {
      const reset = await this.deps.userAdminRepository.resetUserPassword(input.id);
      return ok(mapAdminUserWithTemporaryPasswordDto(reset));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to reset user password.";
      return err(new UserAdminOperationError(message));
    }
  }
}
