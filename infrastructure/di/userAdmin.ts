import { DeleteUserUseCase } from "@/application/use-cases/user/DeleteUserUseCase";
import { InviteUserUseCase } from "@/application/use-cases/user/InviteUserUseCase";
import { ListRolesUseCase } from "@/application/use-cases/user/ListRolesUseCase";
import { ListUsersUseCase } from "@/application/use-cases/user/ListUsersUseCase";
import { UpdateUserUseCase } from "@/application/use-cases/user/UpdateUserUseCase";
import type { IUserAdminRepository } from "@/application/ports/IUserAdminRepository";
import { createSupabaseAdminClient } from "@/infrastructure/auth/supabase/adminClient";
import { SupabaseUserAdminRepository } from "@/infrastructure/auth/supabase/SupabaseUserAdminRepository";

export type UserAdminServices = {
  userAdminRepository: IUserAdminRepository | null;
  listUsersUseCase: ListUsersUseCase;
  listRolesUseCase: ListRolesUseCase;
  inviteUserUseCase: InviteUserUseCase;
  updateUserUseCase: UpdateUserUseCase;
  deleteUserUseCase: DeleteUserUseCase;
};

export function createUserAdminServices(): UserAdminServices {
  const userAdminRepository = createSupabaseAdminClient()
    ? new SupabaseUserAdminRepository()
    : null;

  return {
    userAdminRepository,
    listUsersUseCase: new ListUsersUseCase({ userAdminRepository }),
    listRolesUseCase: new ListRolesUseCase(),
    inviteUserUseCase: new InviteUserUseCase({ userAdminRepository }),
    updateUserUseCase: new UpdateUserUseCase({ userAdminRepository }),
    deleteUserUseCase: new DeleteUserUseCase({ userAdminRepository }),
  };
}
