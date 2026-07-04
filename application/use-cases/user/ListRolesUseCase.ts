import type { RoleCatalogDto } from "@/application/dto/user/userDto";
import {
  PERMISSION_LABELS,
  ROLE_LABELS,
} from "@/application/dto/user/roleCatalog";
import type { IUseCaseWithoutInput } from "@/application/use-cases/IUseCase";
import { authorizeUserAdmin } from "@/application/use-cases/user/authorizeUserAdmin";
import {
  getAllRoles,
  getPermissionsForRole,
  PERMISSIONS,
} from "@/domain/shared/Permission";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export class ListRolesUseCase
  implements IUseCaseWithoutInput<RoleCatalogDto, DomainError>
{
  async execute(ctx: RequestContext): Promise<Result<RoleCatalogDto, DomainError>> {
    const auth = authorizeUserAdmin(ctx);
    if (!auth.ok) {
      return auth;
    }

    return ok({
      roles: getAllRoles().map((role) => ({
        id: role,
        label: ROLE_LABELS[role].label,
        description: ROLE_LABELS[role].description,
        permissions: [...getPermissionsForRole(role)],
      })),
      permissions: PERMISSIONS.map((permission) => ({
        id: permission,
        label: PERMISSION_LABELS[permission].label,
        description: PERMISSION_LABELS[permission].description,
      })),
    });
  }
}
