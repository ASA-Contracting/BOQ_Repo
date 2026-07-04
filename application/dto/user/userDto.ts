import type { Permission } from "@/domain/shared/Permission";
import type { Role } from "@/domain/shared/Role";

export type UserSummaryDto = {
  id: string;
  email: string;
  displayName: string | null;
  roles: Role[];
  permissions: Permission[];
  isActive: boolean;
  lastSignInAt: string | null;
  createdAt: string;
};

export type UserListDto = {
  items: UserSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type RoleDefinitionDto = {
  id: Role;
  label: string;
  description: string;
  permissions: Permission[];
};

export type PermissionDefinitionDto = {
  id: Permission;
  label: string;
  description: string;
};

export type RoleCatalogDto = {
  roles: RoleDefinitionDto[];
  permissions: PermissionDefinitionDto[];
};
