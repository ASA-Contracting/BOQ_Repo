import Link from "next/link";
import { Shield, UserCircle, Users } from "lucide-react";

import { refreshSessionAction } from "@/app/(dashboard)/actions";
import type { SessionUser } from "@/application/dto/session";
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
import { Text } from "@/components/ui/typography";

type SettingsWorkspaceProps = {
  user: SessionUser;
};

export function SettingsWorkspace({ user }: SettingsWorkspaceProps) {
  const isSystemAdmin = user.roles.includes("system_administrator");

  return (
    <WorkspaceLayout>
      <PageHeader
        title="Settings"
        description="Account details and platform administration."
      />

      <PageContent className="space-y-4">
        <Panel>
          <PanelHeader
            title="Your account"
            description="Signed-in user and assigned roles."
          />
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <UserCircle className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <Text weight="semibold">{user.displayName ?? user.email}</Text>
                {user.displayName ? (
                  <Text variant="muted" size="sm">
                    {user.email}
                  </Text>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <Badge key={role} variant="outline">
                      {formatRoleLabel(role)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="warning">No roles assigned</Badge>
                )}
              </div>

              {user.roles.length === 0 ? (
                <div className="space-y-2">
                  <Text variant="muted" size="sm">
                    If an administrator just assigned your role, refresh your
                    session below or sign out and sign back in.
                  </Text>
                  <form action={refreshSessionAction}>
                    <Button type="submit" variant="outline" size="sm">
                      Refresh permissions
                    </Button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 xl:max-w-5xl">
          <Panel>
            <PanelHeader title="Administration" />
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Users className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <Text weight="semibold">User management</Text>
                <Text variant="muted" size="sm">
                  Invite users, assign roles, and review the v1 permission
                  matrix.
                </Text>
                {isSystemAdmin ? (
                  <Button asChild size="sm">
                    <Link href="/settings/users">Open user control panel</Link>
                  </Button>
                ) : (
                  <Text variant="muted" size="sm">
                    Restricted to System Administrators.
                  </Text>
                )}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Security" />
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Shield className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <Text weight="semibold">Role enforcement</Text>
                <Text variant="muted" size="sm">
                  Roles live in Supabase Auth `app_metadata.roles`. The UI hides
                  unauthorized actions; use cases return 403 on the server.
                </Text>
              </div>
            </div>
          </Panel>
        </div>
      </PageContent>
    </WorkspaceLayout>
  );
}
