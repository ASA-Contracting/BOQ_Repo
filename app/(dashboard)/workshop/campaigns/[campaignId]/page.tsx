import Link from "next/link";
import { redirect } from "next/navigation";

import { CampaignDetail } from "@/app/(dashboard)/workshop/campaigns/_components/CampaignDetail";
import { ShellContent } from "@/components/shared/AppShell";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import { getSessionUser } from "@/infrastructure/auth/getSessionUser";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

type CampaignDetailPageProps = {
  params: Promise<{ campaignId: string }>;
};

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const ctx = await resolveRequestContext();
  if (!ctx) {
    redirect("/login");
  }

  const { campaignId: campaignIdParam } = await params;
  const campaignId = Number(campaignIdParam);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    redirect("/workshop/campaigns");
  }

  const detailResult = await getAppServices().workshop.getImportCampaignDetailUseCase.execute(
    ctx,
    { campaignId },
  );

  const detail = detailResult.ok
    ? detailResult.value
    : {
        campaign: {
          id: campaignId,
          name: "Unknown",
          status: "draft",
          totalFiles: 0,
          importedCount: 0,
          aiCompleteCount: 0,
          failedCount: 0,
        },
        jobs: [],
      };

  return (
    <ShellContent className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Text size="lg" weight="semibold">
            {detail.campaign.name}
          </Text>
          <Text variant="muted" size="sm">
            {detail.campaign.aiCompleteCount} / {detail.campaign.totalFiles} ready for review ·{" "}
            {detail.campaign.failedCount} failed
          </Text>
        </div>
        <Button asChild variant="outline">
          <Link href="/workshop/campaigns">All campaigns</Link>
        </Button>
      </div>

      <CampaignDetail campaignId={campaignId} initialDetail={detail} />
    </ShellContent>
  );
}
