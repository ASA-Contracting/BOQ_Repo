"use client";

import { Pencil, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { RolePermissionsMatrix } from "@/app/(dashboard)/settings/users/_components/RolePermissionsMatrix";
import { UserFormDialog } from "@/app/(dashboard)/settings/users/_components/UserFormDialog";
import type {
  RoleCatalogDto,
  UserListDto,
  UserSummaryDto,
} from "@/application/dto/user/userDto";
import { formatRoleLabel } from "@/application/dto/user/roleCatalog";
import {
  PageContent,
  PageHeader,
  Panel,
  PanelHeader,
  WorkspaceLayout,
} from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserAdminWorkspaceProps = {
  initialUsers: UserListDto;
  roleCatalog: RoleCatalogDto;
  configurationError?: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserAdminWorkspace({
  initialUsers,
  roleCatalog,
  configurationError = null,
}: UserAdminWorkspaceProps) {
  const [users, setUsers] = useState(initialUsers.items);
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<"invite" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSummaryDto | null>(null);

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return users;
    }

    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(needle) ||
        (user.displayName?.toLowerCase().includes(needle) ?? false),
    );
  }, [search, users]);

  const columns = useMemo<DataGridColumn<UserSummaryDto>[]>(
    () => [
      {
        id: "name",
        header: "User",
        sortable: true,
        sortKey: "email",
        cell: (user) => (
          <div className="min-w-0 py-1">
            <div className="truncate font-medium">
              {user.displayName ?? user.email}
            </div>
            {user.displayName ? (
              <div className="truncate text-xs text-muted-foreground">
                {user.email}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: "roles",
        header: "Roles",
        cell: (user) => (
          <div className="flex flex-wrap gap-1 py-1">
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <Badge key={role} variant="outline">
                  {formatRoleLabel(role)}
                </Badge>
              ))
            ) : (
              <Badge variant="warning">No roles</Badge>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (user) => (
          <Badge variant={user.isActive ? "success" : "destructive"}>
            {user.isActive ? "Active" : "Disabled"}
          </Badge>
        ),
      },
      {
        id: "lastSignIn",
        header: "Last sign-in",
        cell: (user) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(user.lastSignInAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        align: "right",
        cell: (user) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setDialogMode("edit");
            }}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  function handleUserSaved(savedUser: UserSummaryDto) {
    setUsers((current) => {
      const index = current.findIndex((user) => user.id === savedUser.id);
      if (index === -1) {
        return [savedUser, ...current];
      }

      const next = [...current];
      next[index] = savedUser;
      return next;
    });
  }

  return (
    <WorkspaceLayout>
      <Tabs defaultValue="users" className="flex min-h-0 flex-1 flex-col">
        <PageHeader
          title="User management"
          description="Invite users, assign roles, and review the v1 permission matrix."
          breadcrumbs={[
            { label: "Settings", href: "/settings" },
            { label: "Users" },
          ]}
          actions={
            <Button
              type="button"
              onClick={() => {
                setSelectedUser(null);
                setDialogMode("invite");
              }}
              disabled={Boolean(configurationError)}
            >
              <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
              Invite user
            </Button>
          }
          tabs={
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="roles">Roles & permissions</TabsTrigger>
            </TabsList>
          }
        />

        <PageContent className="min-h-0 flex-1">
          <TabsContent value="users" className="flex min-h-0 flex-1 flex-col gap-4">
            {configurationError ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {configurationError}
              </div>
            ) : null}

            <Panel className="min-h-0 flex-1">
              <PanelHeader
                title="Users"
                description={`${initialUsers.total} account${initialUsers.total === 1 ? "" : "s"} in Supabase Auth.`}
                actions={
                  <Input
                    type="search"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-64"
                    aria-label="Search users"
                  />
                }
              />

              <div className="min-h-[420px] flex-1">
                <DataGrid
                  columns={columns}
                  data={filteredUsers}
                  getRowKey={(user) => user.id}
                  emptyMessage={
                    search.trim()
                      ? "No users match your search."
                      : "No users yet. Invite the first user to get started."
                  }
                  height="100%"
                  aria-label="Users"
                />
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="roles" className="flex min-h-0 flex-1 flex-col">
            <RolePermissionsMatrix
              roles={roleCatalog.roles}
              permissions={roleCatalog.permissions}
            />
          </TabsContent>
        </PageContent>
      </Tabs>

      {dialogMode ? (
        <UserFormDialog
          key={`${dialogMode}-${selectedUser?.id ?? "new"}`}
          mode={dialogMode}
          open
          user={selectedUser}
          roleCatalog={roleCatalog}
          onClose={() => {
            setDialogMode(null);
            setSelectedUser(null);
          }}
          onSuccess={handleUserSaved}
        />
      ) : null}
    </WorkspaceLayout>
  );
}
