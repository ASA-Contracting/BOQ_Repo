import type { IUserAdminRepository } from "@/application/ports/IUserAdminRepository";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeUserAdmin } from "@/application/use-cases/user/authorizeUserAdmin";
import {
  CannotDeleteSelfError,
  LastSystemAdministratorError,
  UserAdminNotConfiguredError,
  UserNotFoundError,
} from "@/domain/user/errors/UserAdminErrors";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type DeleteUserInput = {
  id: string;
};

export type DeleteUserDependencies = {
  userAdminRepository: IUserAdminRepository | null;
};

export class DeleteUserUseCase
  implements IUseCase<DeleteUserInput, void, DomainError>
{
  constructor(private readonly deps: DeleteUserDependencies) {}

  async execute(
    ctx: RequestContext,
    input: DeleteUserInput,
  ): Promise<Result<void, DomainError>> {
    const auth = authorizeUserAdmin(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!this.deps.userAdminRepository) {
      return err(new UserAdminNotConfiguredError());
    }

    if (input.id === ctx.userId) {
      return err(new CannotDeleteSelfError());
    }

    const existing = await this.deps.userAdminRepository.getUserById(input.id);
    if (!existing) {
      return err(new UserNotFoundError(input.id));
    }

    if (
      existing.isActive &&
      existing.roles.includes("system_administrator")
    ) {
      const remaining =
        await this.deps.userAdminRepository.countActiveSystemAdministrators(
          input.id,
        );
      if (remaining === 0) {
        return err(new LastSystemAdministratorError());
      }
    }

    await this.deps.userAdminRepository.deleteUser(input.id);

    return ok(undefined);
  }
}
