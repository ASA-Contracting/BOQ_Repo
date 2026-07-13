"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  BoqLookupCategory,
  BoqLookupOptionDto,
  BoqLookupTone,
} from "@/application/dto/boq/boqLookupOptionDto";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export function useBoqLookupOptions(
  category: BoqLookupCategory = "discipline",
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled ?? true;
  const [items, setItems] = useState<BoqLookupOptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/boq/lookups?category=${encodeURIComponent(category)}`);
      const raw = await response.text();
      let json: ApiEnvelope<BoqLookupOptionDto[]> | null = null;
      if (raw.trim()) {
        json = JSON.parse(raw) as ApiEnvelope<BoqLookupOptionDto[]>;
      }
      if (!response.ok || !json?.success || !json.data) {
        throw new Error(json?.message ?? "Failed to load BOQ settings");
      }
      setItems(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load BOQ settings");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category, enabled]);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { items, loading, error, reload, setItems };
}

export async function createBoqLookupOption(input: {
  category: BoqLookupCategory;
  name: string;
  customLabel?: string | null;
  tone?: BoqLookupTone | null;
  customHex?: string | null;
  sortOrder?: number;
}): Promise<BoqLookupOptionDto> {
  const response = await fetch("/api/boq/lookups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await response.json()) as ApiEnvelope<BoqLookupOptionDto>;
  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message ?? "Failed to create option");
  }
  return json.data;
}

export async function updateBoqLookupOption(
  id: number,
  input: {
    name: string;
    customLabel?: string | null;
    tone?: BoqLookupTone | null;
    customHex?: string | null;
    sortOrder?: number;
  },
): Promise<BoqLookupOptionDto> {
  const response = await fetch(`/api/boq/lookups/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await response.json()) as ApiEnvelope<BoqLookupOptionDto>;
  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message ?? "Failed to update option");
  }
  return json.data;
}

export async function deleteBoqLookupOption(id: number): Promise<void> {
  const response = await fetch(`/api/boq/lookups/${id}`, { method: "DELETE" });
  const json = (await response.json()) as ApiEnvelope<null>;
  if (!response.ok || !json.success) {
    throw new Error(json.message ?? "Failed to delete option");
  }
}

export async function reorderBoqLookupOptions(
  category: BoqLookupCategory,
  orderedIds: number[],
): Promise<BoqLookupOptionDto[]> {
  const response = await fetch("/api/boq/lookups/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, orderedIds }),
  });
  const json = (await response.json()) as ApiEnvelope<BoqLookupOptionDto[]>;
  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message ?? "Failed to reorder options");
  }
  return json.data;
}
