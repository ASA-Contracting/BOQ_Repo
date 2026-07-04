import type { InviteUserInput } from "@/application/dto/user/userSchema";
import type { UserSummaryDto } from "@/application/dto/user/userDto";
import { mapAdminUserToSummaryDto } from "@/application/mappers/user/userMapper";
import type { IUserAdminRepository } from "@/application/ports/IUserAdminRepository";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeUserAdmin } from "@/application/use-cases/user/authorizeUserAdmin";
import { UserAdminNotConfiguredError } from "@/domain/user/errors/UserAdminErrors";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type InviteUserDependencies = {
  userAdminRepository: IUserAdminRepository | null;
};

export class InviteUserUseCase
  implements IUseCase<InviteUserInput, UserSummaryDto, DomainError>
{
  constructor(private readonly deps: InviteUserDependencies) {}

  async execute(
    ctx: RequestContext,
    input: InviteUserInput,
  ): Promise<Result<UserSummaryDto, DomainError>> {
    const auth = authorizeUserAdmin(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!this.deps.userAdminRepository) {
      return err(new UserAdminNotConfiguredError());
    }

    const created = await this.deps.userAdminRepository.inviteUser({
      email: input.email,
      displayName: input.displayName,
      roles: input.roles,
    });

    return ok(mapAdminUserToSummaryDto(created));
  }
}
