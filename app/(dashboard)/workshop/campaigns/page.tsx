import Link from "next/link";
import { redirect } from "next/navigation";

import { CampaignList } from "@/app/(dashboard)/workshop/campaigns/_components/CampaignList";
import { ShellContent } from "@/components/shared/AppShell";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import { getSessionUser } from "@/infrastructure/auth/getSessionUser";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

export default async function CampaignsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const ctx = await resolveRequestContext();
  if (!ctx) {
    redirect("/login");
  }

  const campaignsResult =
    await getAppServices().workshop.listImportCampaignsUseCase.execute(ctx, {});

  const campaigns = campaignsResult.ok ? campaignsResult.value : [];

  return (
    <ShellContent className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Text size="lg" weight="semibold">
            Import campaigns
          </Text>
          <Text variant="muted" size="sm">
            Bulk-import legacy Excel BOQs, run AI categorization, and track progress.
          </Text>
        </div>
        <Button asChild variant="outline">
          <Link href="/workshop">Back to Workshop</Link>
        </Button>
      </div>

      <CampaignList initialCampaigns={campaigns} />
    </ShellContent>
  );
}
