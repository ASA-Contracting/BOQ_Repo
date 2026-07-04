import { Suspense } from "react";
import { redirect } from "next/navigation";

import { BoqMasterListPage } from "@/components/boq/BoqMasterListPage";
import { Text } from "@/components/ui/typography";
import { hasAnyRole } from "@/domain/shared/authorization/hasRole";
import { getSessionUser } from "@/infrastructure/auth/getSessionUser";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

type PageProps = {
  searchParams: Promise<{ boq?: string; projects?: string }>;
};

function BoqMasterListFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Text variant="muted" size="sm">
        Loading BOQ master list…
      </Text>
    </div>
  );
}

async function BoqMasterListContent() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const ctx = await resolveRequestContext();
  if (!ctx) {
    redirect("/login");
  }

  const services = getAppServices();
  const [boqResult, projectResult] = await Promise.all([
    services.boq.listBoqsUseCase.execute(ctx),
    services.project.listProjectsUseCase.execute(ctx, { page: 1, pageSize: 100 }),
  ]);

  const canCloseProject = hasAnyRole(ctx, ["general_manager", "system_administrator"]);

  return (
    <BoqMasterListPage
      boqs={boqResult.ok ? boqResult.value : []}
      boqsError={boqResult.ok ? null : boqResult.error.message}
      projects={projectResult.ok ? projectResult.value.items : []}
      canCloseProject={canCloseProject}
      projectsError={projectResult.ok ? null : projectResult.error.message}
    />
  );
}

export default async function BoqPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (params.boq) {
    const boqId = Number(params.boq);
    if (Number.isFinite(boqId) && boqId > 0) {
      redirect(`/boq/${boqId}`);
    }
  }

  return (
    <Suspense fallback={<BoqMasterListFallback />}>
      <BoqMasterListContent />
    </Suspense>
  );
}
