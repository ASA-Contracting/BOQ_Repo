import { redirect } from "next/navigation";

import { AppShell } from "@/components/shared/AppShell";
import { getSessionUser } from "@/infrastructure/auth/getSessionUser";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
