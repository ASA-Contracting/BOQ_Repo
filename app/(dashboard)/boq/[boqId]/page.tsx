import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getClassificationState } from "@/application/classification/get-classification-state";
import { BoqBreakdownPage } from "@/components/boq/BoqBreakdownPage";
import { Text } from "@/components/ui/typography";
import { loadClassificationPageDataWithTimeout } from "@/app/(dashboard)/classification/load-classification-page-data";
import { getSessionUser } from "@/infrastructure/auth/getSessionUser";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";
import { getDb } from "@/infrastructure/persistence/db";
import { buildCategoryPickerOptions } from "@/lib/category-picker-options";

type PageProps = {
  params: Promise<{ boqId: string }>;
};

function BoqBreakdownFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Text variant="muted" size="sm">
        Loading BOQ breakdown…
      </Text>
    </div>
  );
}

async function BoqBreakdownContent({ boqId }: { boqId: number }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const ctx = await resolveRequestContext();
  if (!ctx) {
    redirect("/login");
  }

  const services = getAppServices();
  const [breakdownResult, classification] = await Promise.all([
    services.boq.getBoqBreakdownUseCase.execute(ctx, { boqId }),
    loadClassificationPageDataWithTimeout(),
  ]);

  if (!breakdownResult.ok) {
    redirect("/boq");
  }

  const db = getDb();
  const state = await getClassificationState(db);
  const categoryOptions = buildCategoryPickerOptions(
    state.materials
      .filter((material) => material.isActive)
      .map((material) => ({
        id: material.id,
        name: material.name,
        materialLevelTypeId: material.levelTypeId,
        parentId: material.parentId,
        schemaId: material.schemaId,
        isActive: material.isActive,
      })),
  );

  return (
    <BoqBreakdownPage
      breakdown={breakdownResult.value}
      categoryOptions={categoryOptions}
      classification={classification}
    />
  );
}

export default async function BoqBreakdownRoute({ params }: PageProps) {
  const { boqId: boqIdParam } = await params;
  const boqId = Number(boqIdParam);

  if (!Number.isFinite(boqId) || boqId <= 0) {
    redirect("/boq");
  }

  return (
    <Suspense fallback={<BoqBreakdownFallback />}>
      <BoqBreakdownContent boqId={boqId} />
    </Suspense>
  );
}
