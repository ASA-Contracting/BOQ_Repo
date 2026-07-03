import Link from "next/link";
import { redirect } from "next/navigation";

import { ShellContent } from "@/components/shared/AppShell";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Text } from "@/components/ui/typography";
import { getSessionUser } from "@/infrastructure/auth/getSessionUser";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

export default async function WorkshopPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const ctx = await resolveRequestContext();
  if (!ctx) {
    redirect("/login");
  }

  const batchesResult =
    await getAppServices().workshop.listRecentWorkshopBatchesUseCase.execute(ctx);

  const batches = batchesResult.ok ? batchesResult.value : [];

  return (
    <ShellContent className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Text size="lg" weight="semibold">
            Workshop
          </Text>
          <Text variant="muted" size="sm">
            Import BOQ files, run AI categorization, and review Family assignments.
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/workshop/import">Import BOQ</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/workshop/campaigns">Bulk campaigns</Link>
          </Button>
        </div>
      </div>

      <Panel>
        <PanelHeader title="Recent batches" />
        <PanelBody>
          {batches.length === 0 ? (
            <Text variant="muted" size="sm">
              No batches yet. Import an Excel BOQ to start categorization.
            </Text>
          ) : (
            <ul className="divide-y divide-border">
              {batches.map((batch) => (
                <li
                  key={batch.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Text weight="medium">{batch.name}</Text>
                    <Text variant="muted" size="xs">
                      {batch.itemsApprovedCount} / {batch.importItemCount} reviewed ·{" "}
                      {batch.status}
                    </Text>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/workshop/categorize/${batch.id}`}>Open</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </PanelBody>
      </Panel>
    </ShellContent>
  );
}
