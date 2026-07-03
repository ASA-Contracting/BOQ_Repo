import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FileSpreadsheet,
  Layers,
  Settings,
} from "lucide-react";

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
    items: [
      { href: "/boq", label: "BOQ", icon: FileSpreadsheet },
      { href: "/classification", label: "Category builder", icon: Layers },
    ],
  },
  {
    title: "Business",
    items: [{ href: "/reports", label: "Reports", icon: BarChart3 }],
  },
  {
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export const shellNavItems: ShellNavItem[] = shellNavSections.flatMap(
  (section) => section.items,
);

const routeLabels: Record<string, string> = Object.fromEntries(
  shellNavItems.map((item) => [item.href, item.label]),
);

routeLabels["/"] = "Home";
routeLabels["/families"] = "Families";
routeLabels["/projects"] = "Projects";

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
    return "BOQ";
  }

  return "Page";
}
