"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  navItemActive,
  navItemBase,
  navItemInactive,
} from "@/lib/design/interactive";
import { cn } from "@/lib/utils";

export type SideNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type SideNavProps = {
  items: SideNavItem[];
  className?: string;
};

export function SideNav({ items, className }: SideNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-1 flex-col gap-0.5 p-2", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              navItemBase,
              isActive ? navItemActive : navItemInactive,
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SideNavSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {title ? (
        <span className="px-2.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </span>
      ) : null}
      {children}
    </div>
  );
}

export function SideNavShell({
  brand,
  header,
  footer,
  children,
  className,
}: {
  brand?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex h-full w-[var(--sidebar-width)] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      {brand ? (
        <div className="flex h-[var(--topnav-height)] shrink-0 items-center px-3">
          {brand}
        </div>
      ) : null}
      {header}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
      {footer ? (
        <div className="shrink-0 border-t border-sidebar-border p-2">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
