"use client";

import { PanelLeft, PanelLeftClose, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";

import { buildShellBreadcrumbs } from "@/components/shared/AppShell/breadcrumbs";
import { useAppShell } from "@/components/shared/AppShell/AppShellContext";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { KeyboardShortcut } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

type CommandBarProps = {
  searchRef: React.RefObject<HTMLInputElement | null>;
  trailing?: React.ReactNode;
};

export function CommandBar({ searchRef, trailing }: CommandBarProps) {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, toggleMobileOpen, commandBarBeforeSearch } = useAppShell();
  const breadcrumbs = buildShellBreadcrumbs(pathname);

  return (
    <header className="flex h-[var(--topnav-height)] shrink-0 items-center gap-2 border-b border-border bg-background px-[var(--space-shell)]">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={toggleMobileOpen}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="hidden md:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={toggleCollapsed}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>

        <div className="hidden min-w-0 sm:block">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>

      {commandBarBeforeSearch}
      <div className="relative hidden w-full max-w-xs lg:block">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search…"
          aria-label="Search"
          className={cn(
            "h-7 w-full rounded-md border border-input bg-muted/40 pr-16 pl-8 text-sm",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        />
        <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
          <KeyboardShortcut keys={["⌘", "K"]} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">{trailing}</div>
    </header>
  );
}
