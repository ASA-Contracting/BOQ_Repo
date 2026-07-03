"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  COLLAPSED_WIDTH,
  MAX_WIDTH,
  MIN_WIDTH,
  useAppShell,
} from "@/components/shared/AppShell/AppShellContext";
import {
  shellNavSections,
  type ShellNavItem,
} from "@/components/shared/AppShell/nav-items";
import { Text } from "@/components/ui/typography";
import {
  navItemActive,
  navItemBase,
  navItemInactive,
} from "@/lib/design/interactive";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: ShellNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        navItemBase,
        collapsed && "justify-center px-2",
        isActive ? navItemActive : navItemInactive,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

type AppShellSidebarProps = {
  footer: React.ReactNode;
};

export function AppShellSidebar({ footer }: AppShellSidebarProps) {
  const pathname = usePathname();
  const {
    collapsed,
    sidebarWidth,
    setSidebarWidth,
    mobileOpen,
    setMobileOpen,
  } = useAppShell();
  const [isResizing, setIsResizing] = React.useState(false);
  const width = collapsed ? COLLAPSED_WIDTH : sidebarWidth;

  const handleResizeStart = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (collapsed) {
        return;
      }
      event.preventDefault();
      setIsResizing(true);
    },
    [collapsed],
  );

  React.useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setSidebarWidth(event.clientX);
    };

    const handlePointerUp = () => setIsResizing(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizing, setSidebarWidth]);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const sidebarContent = (
    <>
      <div
        className={cn(
          "flex h-[var(--topnav-height)] shrink-0 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "px-3",
        )}
      >
        <Link href="/projects" className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
            B
          </span>
          {!collapsed ? (
            <Text weight="semibold" size="sm" className="truncate tracking-tight">
              BOQ Platform
            </Text>
          ) : null}
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-2">
        {shellNavSections.map((section, index) => (
          <div
            key={section.title ?? `section-${index}`}
            className="flex flex-col gap-0.5"
          >
            {section.title && !collapsed ? (
              <span className="px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {section.title}
              </span>
            ) : null}
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                collapsed={collapsed}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-sidebar-border p-2",
          collapsed && "flex flex-col items-center gap-1",
        )}
      >
        {footer}
      </div>

      {!collapsed ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          aria-valuenow={sidebarWidth}
          onPointerDown={handleResizeStart}
          className={cn(
            "absolute inset-y-0 -right-1 z-10 hidden w-2 cursor-col-resize md:block",
            isResizing && "bg-ring/20",
          )}
        />
      ) : null}
    </>
  );

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        style={{ width }}
        className={cn(
          "relative flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
          mobileOpen
            ? "fixed inset-y-0 left-0 z-50 flex shadow-lg"
            : "hidden md:flex",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
