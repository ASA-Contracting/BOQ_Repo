import type { Role } from "@/domain/shared/Role";
import { ROLES } from "@/domain/shared/Role";

/** v1 permission keys — see docs/MASTER_SPECIFICATION.md §7.2 */
export const PERMISSIONS = [
  "view_production",
  "publish_production",
  "close_project",
  "workshop_import",
  "workshop_review",
  "workshop_categorization_approval",
  "family_admin",
  "user_admin",
  "audit_archival",
  "view_reports",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  system_administrator: PERMISSIONS,
  general_manager: [
    "view_production",
    "publish_production",
    "close_project",
    "view_reports",
  ],
  technical_office_manager: [
    "view_production",
    "publish_production",
    "view_reports",
  ],
  estimator: [
    "view_production",
    "workshop_import",
    "workshop_review",
    "workshop_categorization_approval",
    "view_reports",
  ],
  reviewer: [
    "view_production",
    "workshop_review",
    "workshop_categorization_approval",
    "view_reports",
  ],
  ai_reviewer: [
    "view_production",
    "workshop_review",
    "workshop_categorization_approval",
    "view_reports",
  ],
  viewer: ["view_production", "view_reports"],
};

export function getPermissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function getPermissionsForRoles(roles: readonly Role[]): Permission[] {
  const granted = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      granted.add(permission);
    }
  }
  return PERMISSIONS.filter((permission) => granted.has(permission));
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getAllRoles(): readonly Role[] {
  return ROLES;
}
