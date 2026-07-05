import type {
  UserSummaryDto,
  UserWithTemporaryPasswordDto,
} from "@/application/dto/user/userDto";
import { getPermissionsForRoles } from "@/domain/shared/Permission";
import type { AdminUserRecord } from "@/application/ports/IUserAdminRepository";

export function mapAdminUserToSummaryDto(user: AdminUserRecord): UserSummaryDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: [...user.roles],
    permissions: getPermissionsForRoles(user.roles),
    isActive: user.isActive,
    lastSignInAt: user.lastSignInAt,
    createdAt: user.createdAt,
    mustChangePassword: user.mustChangePassword,
  };
}

export function mapAdminUserWithTemporaryPasswordDto(
  result: { user: AdminUserRecord; temporaryPassword: string },
): UserWithTemporaryPasswordDto {
  return {
    ...mapAdminUserToSummaryDto(result.user),
    temporaryPassword: result.temporaryPassword,
  };
}
