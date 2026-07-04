import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FileSpreadsheet,
  Settings,
  Users,
} from "lucide-react";

import type { Role } from "@/domain/shared/Role";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type ShellNavSection = {
  title?: string;
  items: ShellNavItem[];
};

export const shellNavSections: ShellNavSection[] = [
  {
    title: "Workspace",
    items: [{ href: "/boq", label: "BOQ", icon: FileSpreadsheet }],
  },
  {
    title: "Business",
    items: [{ href: "/reports", label: "Reports", icon: BarChart3 }],
  },
  {
    title: "Administration",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export function getShellNavSections(roles: readonly Role[]): ShellNavSection[] {
  const sections = shellNavSections.map((section) => ({
    ...section,
    items: [...section.items],
  }));

  if (roles.includes("system_administrator")) {
    const adminSection = sections.find((section) => section.title === "Administration");
    if (adminSection) {
      adminSection.items.push({
        href: "/settings/users",
        label: "Users",
        icon: Users,
      });
    }
  }

  return sections;
}

export const shellNavItems: ShellNavItem[] = shellNavSections.flatMap(
  (section) => section.items,
);

const routeLabels: Record<string, string> = Object.fromEntries(
  shellNavItems.map((item) => [item.href, item.label]),
);

routeLabels["/"] = "Home";
routeLabels["/families"] = "Families";
routeLabels["/projects"] = "Projects";
routeLabels["/boq/import"] = "Import BOQ";
routeLabels["/settings/users"] = "Users";

export function getRouteLabel(pathname: string): string {
  if (routeLabels[pathname]) {
    return routeLabels[pathname];
  }

  const match = shellNavItems.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  if (match) {
    return match.label;
  }

  if (pathname.startsWith("/boq/")) {
    return "Categorizing";
  }

  return "Page";
}
