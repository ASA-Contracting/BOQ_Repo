"use client";

import { Check, Minus } from "lucide-react";

import type {
  PermissionDefinitionDto,
  RoleDefinitionDto,
} from "@/application/dto/user/userDto";
import { roleHasPermission } from "@/domain/shared/Permission";
import type { Permission } from "@/domain/shared/Permission";
import type { Role } from "@/domain/shared/Role";
import { Panel, PanelHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

type RolePermissionsMatrixProps = {
  roles: RoleDefinitionDto[];
  permissions: PermissionDefinitionDto[];
};

export function RolePermissionsMatrix({
  roles,
  permissions,
}: RolePermissionsMatrixProps) {
  return (
    <Panel className="min-h-0 flex-1 overflow-hidden">
      <PanelHeader
        title="Role permissions"
        description="Reference matrix for v1 roles. Permissions are derived from assigned roles — see docs/MASTER_SPECIFICATION.md §7."
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-medium">
                Permission
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="min-w-[9rem] px-3 py-2 text-center font-medium"
                  title={role.description}
                >
                  <span className="block truncate">{role.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission.id} className="border-b border-border/70">
                <td className="sticky left-0 z-10 bg-background px-3 py-2.5">
                  <div className="font-medium">{permission.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {permission.description}
                  </div>
                </td>
                {roles.map((role) => (
                  <MatrixCell
                    key={`${permission.id}-${role.id}`}
                    role={role.id}
                    permission={permission.id}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function MatrixCell({
  role,
  permission,
}: {
  role: Role;
  permission: Permission;
}) {
  const granted = roleHasPermission(role, permission);

  return (
    <td className="px-3 py-2.5 text-center">
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full",
          granted
            ? "bg-success/15 text-success"
            : "bg-muted text-muted-foreground/50",
        )}
        aria-label={granted ? "Granted" : "Not granted"}
      >
        {granted ? (
          <Check className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Minus className="h-3.5 w-3.5" aria-hidden />
        )}
      </span>
    </td>
  );
}
