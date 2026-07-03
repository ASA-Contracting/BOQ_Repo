"use client";

import { FolderTree, LayoutDashboard } from "lucide-react";

import { SideNav, SideNavShell, type SideNavItem } from "@/components/shared/SideNav";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/typography";

const navItems: SideNavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/families", label: "Families", icon: FolderTree },
];

export function SidebarNav() {
  return <SideNav items={navItems} />;
}

export function AppBrand() {
  return (
    <Text weight="semibold" size="sm" className="tracking-tight">
      BOQ Platform
    </Text>
  );
}

export { SideNavShell, SideNav, type SideNavItem };
