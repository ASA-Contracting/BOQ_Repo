"use client";

import { useCallback, useEffect, useState } from "react";

import type { ClassificationStateDto } from "@/application/classification/dto";
import type { LevelOrderEntity } from "@/domain/classification/entities";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type ClassificationPageData = {
  initialSchemaId: number | null;
  initialSchemas: Array<{ id: number; name: string }>;
  initialState: ClassificationStateDto | null;
  initialChainSteps: LevelOrderEntity[];
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: ClassificationPageData };

const EMPTY: ClassificationPageData = {
  initialSchemaId: null,
  initialSchemas: [],
  initialState: null,
  initialChainSteps: [],
};

async function fetchClassificationPageData(): Promise<ClassificationPageData> {
  const schemasRes = await fetch("/api/classification/schemas");
  const schemasJson = (await schemasRes.json()) as ApiEnvelope<
    Array<{ id: number; name: string }>
  >;

  if (!schemasRes.ok || !schemasJson.success || !schemasJson.data) {
    throw new Error(schemasJson.message ?? "Failed to load classification schemas.");
  }

  const initialSchemas = schemasJson.data.map((schema) => ({
    id: schema.id,
    name: schema.name,
  }));
  const initialSchemaId = initialSchemas[0]?.id ?? null;

  if (!initialSchemaId) {
    return EMPTY;
  }

  const [stateRes, mapsRes] = await Promise.all([
    fetch(
      `/api/classification/state?schemaId=${initialSchemaId}&lite=1`,
    ),
    fetch(`/api/classification/schemas/${initialSchemaId}/level-maps`),
  ]);

  const stateJson = (await stateRes.json()) as ApiEnvelope<ClassificationStateDto>;
  const mapsJson = (await mapsRes.json()) as ApiEnvelope<
    Array<{
      levelTypeId: number;
      levelOrder: number;
      isRequired: boolean | null;
    }>
  >;

  if (!stateRes.ok || !stateJson.success || !stateJson.data) {
    throw new Error(stateJson.message ?? "Failed to load classification state.");
  }

  if (!mapsRes.ok || !mapsJson.success || !mapsJson.data) {
    throw new Error(mapsJson.message ?? "Failed to load schema level maps.");
  }

  const initialChainSteps = mapsJson.data
    .sort((a, b) => a.levelOrder - b.levelOrder)
    .map((map) => ({
      levelTypeId: map.levelTypeId,
      order: map.levelOrder,
      isRequired: map.isRequired ?? true,
    }));

  return {
    initialSchemaId,
    initialSchemas,
    initialState: stateJson.data,
    initialChainSteps,
  };
}

export function useClassificationPageData(enabled: boolean) {
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const reload = useCallback(() => {
    setState({ status: "loading" });
    void fetchClassificationPageData()
      .then((data) => setState({ status: "success", data }))
      .catch((error) =>
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to load classification workspace.",
        }),
      );
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState({ status: "idle" });
      return;
    }
    reload();
  }, [enabled, reload]);

  return { state, reload };
}
