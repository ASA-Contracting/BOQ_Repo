import { redirect } from "next/navigation";

import { CategorizationWorkspace } from "@/app/(dashboard)/workshop/categorize/[batchId]/_components/CategorizationWorkspace";
import { ShellContent } from "@/components/shared/AppShell";
import { getSessionUser } from "@/infrastructure/auth/getSessionUser";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

type CategorizePageProps = {
  params: Promise<{ batchId: string }>;
};

export default async function CategorizePage({ params }: CategorizePageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const ctx = await resolveRequestContext();
  if (!ctx) {
    redirect("/login");
  }

  const { batchId: batchIdParam } = await params;
  const batchId = Number(batchIdParam);
  if (!Number.isInteger(batchId) || batchId <= 0) {
    redirect("/workshop");
  }

  const services = getAppServices();
  const [contextResult, treeResult, levelTypesResult, firstItemResult] =
    await Promise.all([
      services.workshop.getCategorizationBatchContextUseCase.execute(ctx, {
        batchId,
      }),
      services.family.listFamilyTreeUseCase.execute(ctx),
      services.family.listFamilyLevelTypesUseCase.execute(ctx),
      services.workshop.getNextWorkshopItemUseCase.execute(ctx, { batchId }),
    ]);

  if (!contextResult.ok) {
    redirect("/workshop");
  }

  if (!treeResult.ok || !levelTypesResult.ok) {
    throw new Error("Failed to load family reference data.");
  }

  let initialItem = null;
  if (firstItemResult.ok && firstItemResult.value.itemId) {
    const itemResult =
      await services.workshop.getWorkshopItemForReviewUseCase.execute(ctx, {
        batchId,
        itemId: firstItemResult.value.itemId,
      });
    if (itemResult.ok) {
      initialItem = itemResult.value;
    }
  }

  return (
    <ShellContent flush className="h-full">
      <CategorizationWorkspace
        batchId={batchId}
        initialContext={contextResult.value}
        initialItem={initialItem}
        initialTree={treeResult.value}
        levelTypes={levelTypesResult.value}
      />
    </ShellContent>
  );
}
