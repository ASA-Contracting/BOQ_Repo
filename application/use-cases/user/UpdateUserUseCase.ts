import type { UpdateUserInput } from "@/application/dto/user/userSchema";
import type { UserSummaryDto } from "@/application/dto/user/userDto";
import { mapAdminUserToSummaryDto } from "@/application/mappers/user/userMapper";
import type { IUserAdminRepository } from "@/application/ports/IUserAdminRepository";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeUserAdmin } from "@/application/use-cases/user/authorizeUserAdmin";
import {
  LastSystemAdministratorError,
  UserAdminNotConfiguredError,
  UserNotFoundError,
} from "@/domain/user/errors/UserAdminErrors";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type UpdateUserInputWithId = UpdateUserInput & { id: string };

export type UpdateUserDependencies = {
  userAdminRepository: IUserAdminRepository | null;
};

export class UpdateUserUseCase
  implements IUseCase<UpdateUserInputWithId, UserSummaryDto, DomainError>
{
  constructor(private readonly deps: UpdateUserDependencies) {}

  async execute(
    ctx: RequestContext,
    input: UpdateUserInputWithId,
  ): Promise<Result<UserSummaryDto, DomainError>> {
    const auth = authorizeUserAdmin(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!this.deps.userAdminRepository) {
      return err(new UserAdminNotConfiguredError());
    }

    const existing = await this.deps.userAdminRepository.getUserById(input.id);
    if (!existing) {
      return err(new UserNotFoundError(input.id));
    }

    const nextRoles = input.roles ?? existing.roles;
    const nextActive = input.isActive ?? existing.isActive;
    const hadSystemAdmin = existing.roles.includes("system_administrator");
    const willHaveSystemAdmin = nextRoles.includes("system_administrator");

    if (
      existing.isActive &&
      hadSystemAdmin &&
      (!willHaveSystemAdmin || !nextActive)
    ) {
      const remaining =
        await this.deps.userAdminRepository.countActiveSystemAdministrators(
          input.id,
        );
      if (remaining === 0) {
        return err(new LastSystemAdministratorError());
      }
    }

    const updated = await this.deps.userAdminRepository.updateUser({
      id: input.id,
      displayName: input.displayName,
      roles: input.roles,
      isActive: input.isActive,
    });

    return ok(mapAdminUserToSummaryDto(updated));
  }
}
