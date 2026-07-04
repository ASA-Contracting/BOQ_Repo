"use client";

import { SignOutButton } from "@/app/(dashboard)/_components/SignOutButton";
import {
  AppShellProvider,
  useAppShell,
} from "@/components/shared/AppShell/AppShellContext";
import { AppShellSidebar } from "@/components/shared/AppShell/AppShellSidebar";
import { CommandBar } from "@/components/shared/AppShell/CommandBar";
import { useShellShortcuts } from "@/components/shared/AppShell/useShellShortcuts";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserSession } from "@/components/shared/UserSession";
import { WorkshopApprovalInbox } from "@/components/workshop/WorkshopApprovalInbox";
import type { SessionUser } from "@/application/dto/session";

type AppShellProps = {
  user: SessionUser;
  children: React.ReactNode;
};

function ShellSidebarFooter({ user }: { user: SessionUser }) {
  const { collapsed } = useAppShell();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        <UserSession user={user} compact />
        <ThemeToggle />
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <UserSession user={user} />
      <div className="flex items-center gap-0.5">
        <ThemeToggle />
        <SignOutButton />
      </div>
    </div>
  );
}

function AppShellInner({ user, children }: AppShellProps) {
  const searchRef = useShellShortcuts();

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <AppShellSidebar footer={<ShellSidebarFooter user={user} />} roles={user.roles} />

      <div className="flex min-w-0 flex-1 flex-col">
        <CommandBar searchRef={searchRef} trailing={<WorkshopApprovalInbox />} />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <AppShellProvider>
      <AppShellInner user={user}>{children}</AppShellInner>
    </AppShellProvider>
  );
}
