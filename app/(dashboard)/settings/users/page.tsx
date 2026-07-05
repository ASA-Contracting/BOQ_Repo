import { redirect } from "next/navigation";

import { UserAdminWorkspace } from "@/app/(dashboard)/settings/users/_components/UserAdminWorkspace";
import type { UserListDto } from "@/application/dto/user/userDto";
import { ShellContent } from "@/components/shared/AppShell";
import { getSessionUser } from "@/infrastructure/auth/getSessionUser";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

export default async function UserManagementPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("system_administrator")) {
    redirect("/settings");
  }

  const ctx = await resolveRequestContext();
  if (!ctx) {
    redirect("/login");
  }

  const services = getAppServices();
  const [usersResult, rolesResult] = await Promise.all([
    services.userAdmin.listUsersUseCase.execute(ctx, {
      page: 1,
      pageSize: 100,
    }),
    services.userAdmin.listRolesUseCase.execute(ctx),
  ]);

  if (!rolesResult.ok) {
    throw rolesResult.error;
  }

  let configurationError: string | null = null;
  let initialUsers: UserListDto = {
    items: [],
    total: 0,
    page: 1,
    pageSize: 100,
  };

  if (!usersResult.ok) {
    if (usersResult.error.code === "USER_ADMIN_NOT_CONFIGURED") {
      configurationError = usersResult.error.message;
    } else {
      throw usersResult.error;
    }
  } else {
    initialUsers = usersResult.value;
  }

  return (
    <ShellContent flush className="h-full">
      <UserAdminWorkspace
        initialUsers={initialUsers}
        roleCatalog={rolesResult.value}
        currentUserId={user.id}
        configurationError={configurationError}
      />
    </ShellContent>
  );
}
