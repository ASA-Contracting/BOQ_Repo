import { redirect } from "next/navigation";

import { FamiliesWorkspace } from "@/app/(dashboard)/families/_components/FamiliesWorkspace";
import { ShellContent } from "@/components/shared/AppShell";
import { getSessionUser } from "@/infrastructure/auth/getSessionUser";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

export default async function FamiliesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const ctx = await resolveRequestContext();
  if (!ctx) {
    redirect("/login");
  }

  const services = getAppServices();
  const [treeResult, levelTypesResult] = await Promise.all([
    services.family.listFamilyTreeUseCase.execute(ctx),
    services.family.listFamilyLevelTypesUseCase.execute(ctx),
  ]);

  if (!treeResult.ok) {
    throw treeResult.error;
  }

  if (!levelTypesResult.ok) {
    throw levelTypesResult.error;
  }

  return (
    <ShellContent flush className="h-full">
      <FamiliesWorkspace
        key={treeResult.value.map((node) => node.id).join("-")}
        initialTree={treeResult.value}
        levelTypes={levelTypesResult.value}
        canManage={user.roles.includes("system_administrator")}
      />
    </ShellContent>
  );
}
