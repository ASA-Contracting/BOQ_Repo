"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionUser } from "@/application/dto/session";

function formatRole(role: string): string {
  return role.replaceAll("_", " ");
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

type UserSessionProps = {
  user: SessionUser;
  compact?: boolean;
};

export function UserSession({ user, compact = false }: UserSessionProps) {
  const initials = getInitials(user.email, user.displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          compact
            ? "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        }
      >
        <Avatar className={compact ? "h-8 w-8" : "h-8 w-8"}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        {!compact ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user.displayName ?? user.email}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Signed in</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.roles.length > 0 ? (
          user.roles.map((role) => (
            <DropdownMenuItem key={role} disabled>
              {formatRole(role)}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No roles assigned</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
