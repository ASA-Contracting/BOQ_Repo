"use client";

import { useEffect, useRef, useState } from "react";

import type { BoqBreakdownDto, BoqItemRowDto } from "@/application/boq/dto";
import { withCalculatedTotal } from "@/components/boq/boq-breakdown-utils";

type LoadState = "idle" | "loading" | "complete";

export function useBoqBreakdownItemLoader(breakdown: BoqBreakdownDto) {
  const [items, setItems] = useState<BoqItemRowDto[]>(() =>
    breakdown.items.map(withCalculatedTotal),
  );
  const [loadState, setLoadState] = useState<LoadState>(
    breakdown.hasMoreItems ? "idle" : "complete",
  );
  const cursorRef = useRef(breakdown.nextCursor);
  const loadingRef = useRef(false);

  useEffect(() => {
    setItems(breakdown.items.map(withCalculatedTotal));
    cursorRef.current = breakdown.nextCursor;
    setLoadState(breakdown.hasMoreItems ? "idle" : "complete");
  }, [breakdown.id, breakdown.versionId, breakdown.items, breakdown.hasMoreItems, breakdown.nextCursor]);

  useEffect(() => {
    if (loadState === "complete" || loadingRef.current || !cursorRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoadState("loading");

    const params = new URLSearchParams({
      cursor: cursorRef.current,
      limit: "200",
    });
    if (breakdown.versionId) {
      params.set("versionId", String(breakdown.versionId));
    }

    fetch(`/api/boq/${breakdown.id}/items?${params.toString()}`)
      .then(async (res) => {
        const json = (await res.json()) as
          | {
              success: boolean;
              data: { items: BoqItemRowDto[]; nextCursor: string | null };
            }
          | { error: string; message?: string };
        if (!res.ok || !("success" in json) || !json.success) {
          setLoadState("complete");
          return;
        }

        setItems((current) => {
          const seen = new Set(current.map((row) => row.id));
          const merged = [...current];
          for (const row of json.data.items) {
            if (!seen.has(row.id)) {
              merged.push(withCalculatedTotal(row));
            }
          }
          return merged;
        });

        cursorRef.current = json.data.nextCursor;
        setLoadState(json.data.nextCursor ? "idle" : "complete");
      })
      .catch(() => setLoadState("complete"))
      .finally(() => {
        loadingRef.current = false;
      });
  }, [breakdown.id, breakdown.versionId, loadState]);

  return { items, setItems, loadState, allItemsLoaded: loadState === "complete" };
}
