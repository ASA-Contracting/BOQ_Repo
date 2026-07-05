import type { Role } from "@/domain/shared/Role";

export type AdminUserRecord = {
  id: string;
  email: string;
  displayName: string | null;
  roles: Role[];
  isActive: boolean;
  lastSignInAt: string | null;
  createdAt: string;
  mustChangePassword: boolean;
};

export type AdminUserWithTemporaryPassword = {
  user: AdminUserRecord;
  temporaryPassword: string;
};

export type ListUsersParams = {
  page: number;
  pageSize: number;
  search?: string;
};

export type InviteUserParams = {
  email: string;
  displayName?: string;
  roles: Role[];
};

export type UpdateUserParams = {
  id: string;
  displayName?: string | null;
  roles?: Role[];
  isActive?: boolean;
};

export interface IUserAdminRepository {
  listUsers(
    params: ListUsersParams,
  ): Promise<{ items: AdminUserRecord[]; total: number }>;

  getUserById(id: string): Promise<AdminUserRecord | null>;

  inviteUser(params: InviteUserParams): Promise<AdminUserWithTemporaryPassword>;

  resetUserPassword(id: string): Promise<AdminUserWithTemporaryPassword>;

  clearMustChangePassword(userId: string): Promise<void>;

  updateUser(params: UpdateUserParams): Promise<AdminUserRecord>;

  deleteUser(id: string): Promise<void>;

  countActiveSystemAdministrators(excludeUserId?: string): Promise<number>;
}
