"use client";

import { KeyRound, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { DeleteUserDialog } from "@/app/(dashboard)/settings/users/_components/DeleteUserDialog";
import { RolePermissionsMatrix } from "@/app/(dashboard)/settings/users/_components/RolePermissionsMatrix";
import { TemporaryPasswordDialog } from "@/app/(dashboard)/settings/users/_components/TemporaryPasswordDialog";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type UserAdminWorkspaceProps = {
  initialUsers: UserListDto;
  roleCatalog: RoleCatalogDto;
  currentUserId: string;
  configurationError?: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(email: string, displayName: string | null): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  return email.slice(0, 2).toUpperCase();
}

function UserSummaryStats({ users }: { users: UserSummaryDto[] }) {
  const activeCount = users.filter((user) => user.isActive).length;
  const disabledCount = users.length - activeCount;
  const adminCount = users.filter((user) =>
    user.roles.includes("system_administrator"),
  ).length;

  const stats = [
    { label: "Total accounts", value: users.length },
    { label: "Active", value: activeCount, tone: "success" as const },
    { label: "Disabled", value: disabledCount, tone: "muted" as const },
    { label: "Administrators", value: adminCount, tone: "info" as const },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-card px-4 py-3 shadow-xs"
        >
          <Text variant="muted" size="xs" className="uppercase tracking-wide">
            {stat.label}
          </Text>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums tracking-tight">
              {stat.value}
            </span>
            {stat.tone === "success" && stat.value > 0 ? (
              <Badge variant="success" className="text-[10px]">
                Live
              </Badge>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserAdminWorkspace({
  initialUsers,
  roleCatalog,
  currentUserId,
  configurationError = null,
}: UserAdminWorkspaceProps) {
  const [users, setUsers] = useState(initialUsers.items);
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<"invite" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSummaryDto | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserSummaryDto | null>(null);
  const [temporaryPasswordState, setTemporaryPasswordState] = useState<{
    user: UserSummaryDto;
    temporaryPassword: string;
    mode: "create" | "reset";
  } | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

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

  const handleUserSaved = useCallback(
    (savedUser: UserSummaryDto, temporaryPassword?: string) => {
      setUsers((current) => {
        const index = current.findIndex((user) => user.id === savedUser.id);
        if (index === -1) {
          return [savedUser, ...current];
        }

        const next = [...current];
        next[index] = savedUser;
        return next;
      });

      if (temporaryPassword) {
        setTemporaryPasswordState({
          user: savedUser,
          temporaryPassword,
          mode: "create",
        });
      }
    },
    [],
  );

  const columns = useMemo<DataGridColumn<UserSummaryDto>[]>(
    () => [
      {
        id: "displayName",
        header: "Name",
        sortable: true,
        minWidth: 180,
        width: 220,
        cell: (user) => {
          const initials = getInitials(user.email, user.displayName);

          return (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
                <AvatarFallback className="bg-secondary text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "truncate text-sm",
                  user.displayName
                    ? "font-medium text-foreground"
                    : "italic text-muted-foreground",
                )}
              >
                {user.displayName ?? "No display name"}
              </span>
            </div>
          );
        },
      },
      {
        id: "email",
        header: "Email",
        sortable: true,
        minWidth: 240,
        width: 300,
        cell: (user) => (
          <span className="block truncate font-mono text-sm text-foreground/90">
            {user.email}
          </span>
        ),
      },
      {
        id: "roles",
        header: "Roles",
        minWidth: 200,
        width: 240,
        cell: (user) => (
          <div className="flex flex-wrap gap-1.5">
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <Badge key={role} variant="outline" className="font-normal">
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
        minWidth: 110,
        width: 120,
        cell: (user) => (
          <Badge variant={user.isActive ? "success" : "destructive"}>
            {user.isActive ? "Active" : "Disabled"}
          </Badge>
        ),
      },
      {
        id: "lastSignIn",
        header: "Last sign-in",
        minWidth: 160,
        width: 180,
        cell: (user) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
            {formatDate(user.lastSignInAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        minWidth: 280,
        width: 320,
        cell: (user) => {
          const isSelf = user.id === currentUserId;
          const isResetting = resettingUserId === user.id;

          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={isResetting}
                onClick={async () => {
                  setResettingUserId(user.id);
                  try {
                    const response = await fetch(
                      `/api/v1/users/${user.id}/reset-password`,
                      { method: "POST" },
                    );
                    const payload = (await response.json().catch(() => null)) as {
                      data?: UserSummaryDto & { temporaryPassword?: string };
                      error?: { message?: string };
                    } | null;

                    if (!response.ok || !payload?.data?.temporaryPassword) {
                      window.alert(
                        payload?.error?.message ?? "Unable to reset password.",
                      );
                      return;
                    }

                    handleUserSaved(payload.data);
                    setTemporaryPasswordState({
                      user: payload.data,
                      temporaryPassword: payload.data.temporaryPassword,
                      mode: "reset",
                    });
                  } catch {
                    window.alert("Network error while resetting password.");
                  } finally {
                    setResettingUserId(null);
                  }
                }}
              >
                <KeyRound className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {isResetting ? "Resetting..." : "Reset password"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  setSelectedUser(user);
                  setDialogMode("edit");
                }}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-destructive hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                disabled={isSelf}
                title={isSelf ? "You cannot delete your own account" : undefined}
                onClick={() => setUserToDelete(user)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [currentUserId, resettingUserId, handleUserSaved],
  );

  function handleUserDeleted(userId: string) {
    setUsers((current) => current.filter((user) => user.id !== userId));
  }

  const accountLabel = `${users.length} account${users.length === 1 ? "" : "s"}`;

  return (
    <WorkspaceLayout>
      <Tabs defaultValue="users" className="flex min-h-0 flex-1 flex-col">
        <PageHeader
          title="User management"
          description="Add users with temporary passwords, assign roles, and review the v1 permission matrix."
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
              Add user
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

            <UserSummaryStats users={users} />

            <Panel className="min-h-0 flex-1 overflow-hidden rounded-lg shadow-xs">
              <PanelHeader
                title="Users"
                description={`${accountLabel} in Supabase Auth.`}
                className="px-1"
                actions={
                  <div className="relative">
                    <Users
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      type="search"
                      placeholder="Search by name or email"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-72 pl-9"
                      aria-label="Search users"
                    />
                  </div>
                }
              />

              {search.trim() && filteredUsers.length !== users.length ? (
                <div className="mb-3 rounded-md border border-border/70 bg-muted/40 px-3 py-2">
                  <Text variant="muted" size="sm">
                    Showing {filteredUsers.length} of {users.length} users
                  </Text>
                </div>
              ) : null}

              <div className="min-h-[420px] flex-1 overflow-hidden rounded-md">
                <DataGrid
                  columns={columns}
                  data={filteredUsers}
                  getRowKey={(user) => user.id}
                  emptyMessage={
                    search.trim()
                      ? "No users match your search."
                      : "No users yet. Add the first user to get started."
                  }
                  height="100%"
                  tableClassName="users-admin-table"
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

      <TemporaryPasswordDialog
        open={Boolean(temporaryPasswordState)}
        user={temporaryPasswordState?.user ?? null}
        temporaryPassword={temporaryPasswordState?.temporaryPassword ?? ""}
        mode={temporaryPasswordState?.mode ?? "create"}
        onClose={() => setTemporaryPasswordState(null)}
      />

      <DeleteUserDialog
        open={Boolean(userToDelete)}
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onSuccess={handleUserDeleted}
      />
    </WorkspaceLayout>
  );
}
