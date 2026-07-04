import { redirect } from "next/navigation";

import { SettingsWorkspace } from "@/app/(dashboard)/settings/_components/SettingsWorkspace";
import { ShellContent } from "@/components/shared/AppShell";
import { getSessionUser } from "@/infrastructure/auth/getSessionUser";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <ShellContent flush className="h-full">
      <SettingsWorkspace user={user} />
    </ShellContent>
  );
}
