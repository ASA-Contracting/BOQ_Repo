"use client";

import * as React from "react";

import type { SavedFilterDefinition, SavedFilterItem } from "@/lib/filter-engine";
import { hasSavedViewContent } from "@/lib/filter-engine";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function useSavedFilters(pageKey: string) {
  const [items, setItems] = React.useState<SavedFilterItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeId, setActiveId] = React.useState<number | null>(null);

  const load = React.useCallback(async (force = false): Promise<SavedFilterItem[]> => {
    if (!pageKey) {
      return [];
    }
    if (loading && !force) {
      return items;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/saved-filters?pageKey=${encodeURIComponent(pageKey)}`);
      const payload = (await response.json()) as ApiResponse<SavedFilterItem[]>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load saved views");
      }
      const nextItems = payload.data ?? [];
      setItems(nextItems);
      return nextItems;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load saved views");
      return items;
    } finally {
      setLoading(false);
    }
  }, [items, loading, pageKey]);

  const save = React.useCallback(
    async (name: string, definition: SavedFilterDefinition | null) => {
      if (!definition || !hasSavedViewContent(definition)) {
        throw new Error("Adjust the grid before saving a view.");
      }

      setBusy(true);
      setError(null);
      try {
        const response = await fetch("/api/saved-filters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageKey, name, definition }),
        });
        const payload = (await response.json()) as ApiResponse<SavedFilterItem>;
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to save view");
        }
        await load(true);
        setActiveId(payload.data.id);
        return payload.data;
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : "Failed to save view";
        setError(message);
        throw saveError;
      } finally {
        setBusy(false);
      }
    },
    [load, pageKey],
  );

  const remove = React.useCallback(
    async (id: number) => {
      setBusy(true);
      setError(null);
      try {
        const response = await fetch(`/api/saved-filters/${id}`, { method: "DELETE" });
        const payload = (await response.json()) as ApiResponse<null>;
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to delete saved view");
        }
        if (activeId === id) {
          setActiveId(null);
        }
        await load(true);
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "Failed to delete saved view");
        throw deleteError;
      } finally {
        setBusy(false);
      }
    },
    [activeId, load],
  );

  const setFavorite = React.useCallback(
    async (id: number) => {
      setBusy(true);
      setError(null);
      try {
        const response = await fetch(`/api/saved-filters/${id}/favorite`, { method: "POST" });
        const payload = (await response.json()) as ApiResponse<SavedFilterItem>;
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to update default view");
        }
        await load(true);
        return payload.data;
      } catch (favoriteError) {
        setError(favoriteError instanceof Error ? favoriteError.message : "Failed to update default view");
        throw favoriteError;
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const favorite = React.useMemo(
    () => items.find((item) => item.isFavorite) ?? null,
    [items],
  );

  return {
    items,
    loading,
    busy,
    error,
    activeId,
    setActiveId,
    favorite,
    load,
    save,
    remove,
    setFavorite,
  };
}
