"use client";

import { useCallback, useState } from "react";

import type { BoqVersionSummaryDto } from "@/application/boq/dto";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export function formatBoqVersionLabel(version: Pick<
  BoqVersionSummaryDto,
  "versionName" | "versionNumber" | "approvalStatus"
>): string {
  if (version.approvalStatus === "approved") {
    return (
      version.versionName ??
      (version.versionNumber != null ? `Version ${version.versionNumber}` : "Approved")
    );
  }
  return version.versionName ?? "Draft";
}

export function useBoqVersions(boqId: number, currentVersionId: number | null) {
  const [versions, setVersions] = useState<BoqVersionSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (currentVersionId != null) {
        params.set("versionId", String(currentVersionId));
      }
      const query = params.toString();
      const response = await fetch(
        `/api/boq/${boqId}/versions${query ? `?${query}` : ""}`,
      );
      const json = (await response.json()) as ApiEnvelope<BoqVersionSummaryDto[]>;
      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "Failed to load versions");
      }
      setVersions(json.data);
      setLoaded(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load versions");
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [boqId, currentVersionId]);

  const ensureLoaded = useCallback(() => {
    if (!loaded && !loading) {
      void load();
    }
  }, [load, loaded, loading]);

  return { versions, loading, error, loaded, load, ensureLoaded };
}
