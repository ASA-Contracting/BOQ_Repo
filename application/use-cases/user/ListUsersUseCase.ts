import type { ListUsersQuery } from "@/application/dto/user/userSchema";
import type { UserListDto } from "@/application/dto/user/userDto";
import { mapAdminUserToSummaryDto } from "@/application/mappers/user/userMapper";
import type { IUserAdminRepository } from "@/application/ports/IUserAdminRepository";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeUserAdmin } from "@/application/use-cases/user/authorizeUserAdmin";
import { UserAdminNotConfiguredError } from "@/domain/user/errors/UserAdminErrors";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type ListUsersDependencies = {
  userAdminRepository: IUserAdminRepository | null;
};

export class ListUsersUseCase
  implements IUseCase<ListUsersQuery, UserListDto, DomainError>
{
  constructor(private readonly deps: ListUsersDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ListUsersQuery,
  ): Promise<Result<UserListDto, DomainError>> {
    const auth = authorizeUserAdmin(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!this.deps.userAdminRepository) {
      return err(new UserAdminNotConfiguredError());
    }

    const result = await this.deps.userAdminRepository.listUsers({
      page: input.page,
      pageSize: input.pageSize,
      search: input.search,
    });

    return ok({
      items: result.items.map(mapAdminUserToSummaryDto),
      total: result.total,
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
