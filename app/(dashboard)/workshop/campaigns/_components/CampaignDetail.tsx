"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  getNextCampaignItemAction,
  processCampaignJobsAction,
} from "@/app/(dashboard)/workshop/campaigns/actions";
import type { ImportCampaignDetailDto } from "@/application/dto/workshop/campaignDto";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/notifications-provider";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Text } from "@/components/ui/typography";

type CampaignDetailProps = {
  campaignId: number;
  initialDetail: ImportCampaignDetailDto;
};

export function CampaignDetail({ campaignId, initialDetail }: CampaignDetailProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [processing, setProcessing] = useState(false);
  const [detail] = useState(initialDetail);

  const handleProcess = useCallback(async () => {
    setProcessing(true);
    try {
      const result = await processCampaignJobsAction({
        campaignId,
        maxJobs: 3,
      });
      if (!result.success) {
        notify(result.error.message, "error");
        return;
      }

      notify(
        `Processed ${result.data.processedCount} job(s): ${result.data.succeededCount} succeeded, ${result.data.failedCount} failed.`,
        result.data.failedCount > 0 ? "error" : "success",
      );
      router.refresh();
    } finally {
      setProcessing(false);
    }
  }, [campaignId, notify, router]);

  const handleReviewNext = useCallback(async () => {
    const result = await getNextCampaignItemAction(campaignId);
    if (!result.success) {
      notify(result.error.message, "error");
      return;
    }

    if (!result.data.batchId || !result.data.itemId) {
      notify("No items pending review in this campaign.", "info");
      return;
    }

    router.push(
      `/workshop/categorize/${result.data.batchId}?itemId=${result.data.itemId}&campaignId=${campaignId}`,
    );
  }, [campaignId, notify, router]);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader title="Actions" />
        <PanelBody className="flex flex-wrap gap-2">
          <Button onClick={handleProcess} disabled={processing}>
            {processing ? "Processing…" : "Process pending jobs (×3)"}
          </Button>
          <Button variant="outline" onClick={handleReviewNext}>
            Review next item
          </Button>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="Jobs" />
        <PanelBody>
          {detail.jobs.length === 0 ? (
            <Text variant="muted" size="sm">
              No jobs enqueued. Upload a ZIP of Excel files from the campaigns list.
            </Text>
          ) : (
            <ul className="divide-y divide-border">
              {detail.jobs.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Text weight="medium">{job.fileName}</Text>
                    <Text variant="muted" size="xs">
                      {job.status}
                      {job.errorMessage ? ` · ${job.errorMessage}` : ""}
                    </Text>
                  </div>
                  {job.workshopBatchId ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/workshop/categorize/${job.workshopBatchId}`}>
                        Review
                      </Link>
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
