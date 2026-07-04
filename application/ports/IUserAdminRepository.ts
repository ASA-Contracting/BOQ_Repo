import type { Role } from "@/domain/shared/Role";

export type AdminUserRecord = {
  id: string;
  email: string;
  displayName: string | null;
  roles: Role[];
  isActive: boolean;
  lastSignInAt: string | null;
  createdAt: string;
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

  inviteUser(params: InviteUserParams): Promise<AdminUserRecord>;

  updateUser(params: UpdateUserParams): Promise<AdminUserRecord>;

  countActiveSystemAdministrators(excludeUserId?: string): Promise<number>;
}
