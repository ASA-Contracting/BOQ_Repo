"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  createCampaignAction,
  uploadCampaignZipAction,
} from "@/app/(dashboard)/workshop/campaigns/actions";
import type { ImportCampaignDto } from "@/application/dto/workshop/campaignDto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotifications } from "@/components/ui/notifications-provider";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Text } from "@/components/ui/typography";

type CampaignListProps = {
  initialCampaigns: ImportCampaignDto[];
};

export function CampaignList({ initialCampaigns }: CampaignListProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      notify("Enter a campaign name.", "error");
      return;
    }

    setCreating(true);
    try {
      const result = await createCampaignAction({ name: name.trim() });
      if (!result.success) {
        notify(result.error.message, "error");
        return;
      }

      setCampaigns((current) => [result.data, ...current]);
      setName("");
      notify("Campaign created.", "success");
      router.refresh();
    } finally {
      setCreating(false);
    }
  }, [name, notify, router]);

  const handleZipUpload = useCallback(
    async (campaignId: number, file: File) => {
      setUploadingId(campaignId);
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (const byte of bytes) {
          binary += String.fromCharCode(byte);
        }
        const zipBase64 = btoa(binary);

        const result = await uploadCampaignZipAction({ campaignId, zipBase64 });
        if (!result.success) {
          notify(result.error.message, "error");
          return;
        }

        notify(`Enqueued ${result.data.enqueuedFiles} Excel file(s).`, "success");
        router.refresh();
      } finally {
        setUploadingId(null);
      }
    },
    [notify, router],
  );

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader title="New campaign" />
        <PanelBody className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1 space-y-1">
            <Label htmlFor="campaign-name">Campaign name</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Legacy BOQ batch Q1"
            />
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "Create campaign"}
          </Button>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="Campaigns" />
        <PanelBody>
          {campaigns.length === 0 ? (
            <Text variant="muted" size="sm">
              No campaigns yet. Create one and upload a ZIP of Excel BOQ files.
            </Text>
          ) : (
            <ul className="divide-y divide-border">
              {campaigns.map((campaign) => (
                <li
                  key={campaign.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Text weight="medium">{campaign.name}</Text>
                    <Text variant="muted" size="xs">
                      {campaign.aiCompleteCount} / {campaign.totalFiles} AI complete ·{" "}
                      {campaign.failedCount} failed · {campaign.status}
                    </Text>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="sr-only" htmlFor={`zip-${campaign.id}`}>
                      Upload ZIP
                    </Label>
                    <Input
                      id={`zip-${campaign.id}`}
                      type="file"
                      accept=".zip"
                      className="max-w-[220px]"
                      disabled={uploadingId === campaign.id}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleZipUpload(campaign.id, file);
                        }
                      }}
                    />
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/workshop/campaigns/${campaign.id}`}>Open</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
