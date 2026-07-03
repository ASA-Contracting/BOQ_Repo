"use client";

import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { getRouteLabel } from "@/components/shared/AppShell/nav-items";

export function buildShellBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/" || pathname === "/projects") {
    return [{ label: "Projects" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/projects" }];

  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    const isLast = path === pathname;
    crumbs.push({
      label: getRouteLabel(path),
      href: isLast ? undefined : path,
    });
  }

  return crumbs;
}
