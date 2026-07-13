"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_PIVOT_WORKSPACE,
  SAVED_VIEWS_STORAGE_KEY,
  type DropZoneId,
} from "@/components/analytics/PricingPivot/constants";
import {
  buildPivotQuery,
  usePricingPivotCompute,
  type PricingPivotFetchState,
} from "@/components/analytics/PricingPivot/hooks/usePricingPivotData";
import type {
  PivotAggregatorId,
  PivotEngineResult,
  PivotSavedView,
  PivotSortOrder,
  PivotSummaryMetrics,
  PivotValueFilter,
} from "@/lib/analytics/pivot-engine/types";

export type PivotDensity = "compact" | "comfortable";

type WorkspaceState = {
  rows: string[];
  cols: string[];
  vals: string[];
  aggregatorName: PivotAggregatorId;
  valueFilter: PivotValueFilter;
  rowOrder: PivotSortOrder;
  colOrder: PivotSortOrder;
};

type UiState = {
  gridSearch: string;
  density: PivotDensity;
  heatmapEnabled: boolean;
  showTotals: boolean;
  filterField: string | null;
};

type WorkspaceAction =
  | { type: "set-zone-fields"; zone: DropZoneId; fields: string[] }
  | { type: "add-to-zone"; zone: DropZoneId; field: string }
  | { type: "remove-from-zone"; zone: DropZoneId; field: string }
  | { type: "set-aggregator"; aggregatorName: PivotAggregatorId }
  | { type: "set-value-filter"; valueFilter: PivotValueFilter }
  | { type: "reset-workspace" }
  | { type: "apply-view"; view: WorkspaceState };

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "set-zone-fields":
      if (action.zone === "rows") return { ...state, rows: action.fields };
      if (action.zone === "cols") return { ...state, cols: action.fields };
      if (action.zone === "vals") return { ...state, vals: action.fields };
      return state;
    case "add-to-zone": {
      if (action.zone === "filters") return state;
      const key = action.zone === "rows" ? "rows" : action.zone === "cols" ? "cols" : "vals";
      if (state[key].includes(action.field)) return state;
      return { ...state, [key]: [...state[key], action.field] };
    }
    case "remove-from-zone": {
      if (action.zone === "rows") {
        return { ...state, rows: state.rows.filter((field) => field !== action.field) };
      }
      if (action.zone === "cols") {
        return { ...state, cols: state.cols.filter((field) => field !== action.field) };
      }
      if (action.zone === "vals") {
        return { ...state, vals: state.vals.filter((field) => field !== action.field) };
      }
      const next = { ...state.valueFilter };
      delete next[action.field];
      return { ...state, valueFilter: next };
    }
    case "set-aggregator":
      return { ...state, aggregatorName: action.aggregatorName };
    case "set-value-filter":
      return { ...state, valueFilter: action.valueFilter };
    case "reset-workspace":
      return { ...DEFAULT_PIVOT_WORKSPACE, valueFilter: {} };
    case "apply-view":
      return { ...action.view };
    default:
      return state;
  }
}

type PricingPivotDataContextValue = {
  fetchState: PricingPivotFetchState;
  reload: () => void;
  rowCount: number;
  pivotResult: PivotEngineResult | null;
  summary: PivotSummaryMetrics | null;
};

type PricingPivotWorkspaceContextValue = {
  workspace: WorkspaceState;
  ui: UiState;
  savedViews: PivotSavedView[];
  filterFields: string[];
  setGridSearch: (value: string) => void;
  setDensity: (density: PivotDensity) => void;
  setHeatmapEnabled: (enabled: boolean) => void;
  setShowTotals: (enabled: boolean) => void;
  setFilterField: (field: string | null) => void;
  setZoneFields: (zone: DropZoneId, fields: string[]) => void;
  addFieldToZone: (zone: DropZoneId, field: string) => void;
  removeFieldFromZone: (zone: DropZoneId, field: string) => void;
  setAggregator: (aggregatorName: PivotAggregatorId) => void;
  setValueFilter: (valueFilter: PivotValueFilter) => void;
  resetWorkspace: () => void;
  saveCurrentView: (name: string) => void;
  applySavedView: (viewId: string) => void;
  deleteSavedView: (viewId: string) => void;
};

type PricingPivotContextValue = PricingPivotDataContextValue & PricingPivotWorkspaceContextValue;

const PricingPivotDataContext = createContext<PricingPivotDataContextValue | null>(null);
const PricingPivotWorkspaceContext = createContext<PricingPivotWorkspaceContextValue | null>(null);

function loadSavedViews(): PivotSavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PivotSavedView[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type ProviderProps = {
  children: ReactNode;
};

export function PricingPivotProvider({ children }: ProviderProps) {
  const [workspace, dispatch] = useReducer(workspaceReducer, DEFAULT_PIVOT_WORKSPACE);
  const [ui, setUi] = useState<UiState>({
    gridSearch: "",
    density: "compact",
    heatmapEnabled: false,
    showTotals: true,
    filterField: null,
  });
  const [savedViews, setSavedViews] = useState<PivotSavedView[]>(() => loadSavedViews());

  const pivotQuery = useMemo(
    () => buildPivotQuery(workspace, ui.gridSearch),
    [workspace, ui.gridSearch],
  );

  const { state: fetchState, reload } = usePricingPivotCompute(pivotQuery);

  const rowCount = fetchState.status === "success" ? fetchState.data.rowCount : 0;
  const pivotResult =
    fetchState.status === "success" ? fetchState.data.pivotResult : null;
  const summary = fetchState.status === "success" ? fetchState.data.summary : null;

  const filterFields = useMemo(
    () => Object.keys(workspace.valueFilter),
    [workspace.valueFilter],
  );

  const persistViews = useCallback((views: PivotSavedView[]) => {
    setSavedViews(views);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(views));
    }
  }, []);

  const setGridSearch = useCallback(
    (gridSearch: string) => setUi((prev) => ({ ...prev, gridSearch })),
    [],
  );
  const setDensity = useCallback(
    (density: PivotDensity) => setUi((prev) => ({ ...prev, density })),
    [],
  );
  const setHeatmapEnabled = useCallback(
    (heatmapEnabled: boolean) => setUi((prev) => ({ ...prev, heatmapEnabled })),
    [],
  );
  const setShowTotals = useCallback(
    (showTotals: boolean) => setUi((prev) => ({ ...prev, showTotals })),
    [],
  );
  const setFilterField = useCallback(
    (filterField: string | null) => setUi((prev) => ({ ...prev, filterField })),
    [],
  );
  const setZoneFields = useCallback(
    (zone: DropZoneId, fields: string[]) =>
      dispatch({ type: "set-zone-fields", zone, fields }),
    [],
  );
  const addFieldToZone = useCallback(
    (zone: DropZoneId, field: string) => dispatch({ type: "add-to-zone", zone, field }),
    [],
  );
  const removeFieldFromZone = useCallback(
    (zone: DropZoneId, field: string) =>
      dispatch({ type: "remove-from-zone", zone, field }),
    [],
  );
  const setAggregator = useCallback(
    (aggregatorName: PivotAggregatorId) =>
      dispatch({ type: "set-aggregator", aggregatorName }),
    [],
  );
  const setValueFilter = useCallback(
    (valueFilter: PivotValueFilter) => dispatch({ type: "set-value-filter", valueFilter }),
    [],
  );
  const resetWorkspace = useCallback(() => dispatch({ type: "reset-workspace" }), []);
  const saveCurrentView = useCallback(
    (name: string) => {
      const view: PivotSavedView = {
        id: crypto.randomUUID(),
        name: name.trim() || "Untitled view",
        rows: workspace.rows,
        cols: workspace.cols,
        vals: workspace.vals,
        aggregatorName: workspace.aggregatorName,
        valueFilter: workspace.valueFilter,
        rowOrder: workspace.rowOrder,
        colOrder: workspace.colOrder,
        createdAt: new Date().toISOString(),
      };
      persistViews([view, ...savedViews].slice(0, 20));
    },
    [persistViews, savedViews, workspace],
  );
  const applySavedView = useCallback(
    (viewId: string) => {
      const view = savedViews.find((entry) => entry.id === viewId);
      if (view) dispatch({ type: "apply-view", view });
    },
    [savedViews],
  );
  const deleteSavedView = useCallback(
    (viewId: string) => {
      persistViews(savedViews.filter((entry) => entry.id !== viewId));
    },
    [persistViews, savedViews],
  );

  const dataValue = useMemo<PricingPivotDataContextValue>(
    () => ({
      fetchState,
      reload,
      rowCount,
      pivotResult,
      summary,
    }),
    [fetchState, reload, rowCount, pivotResult, summary],
  );

  const workspaceValue = useMemo<PricingPivotWorkspaceContextValue>(
    () => ({
      workspace,
      ui,
      savedViews,
      filterFields,
      setGridSearch,
      setDensity,
      setHeatmapEnabled,
      setShowTotals,
      setFilterField,
      setZoneFields,
      addFieldToZone,
      removeFieldFromZone,
      setAggregator,
      setValueFilter,
      resetWorkspace,
      saveCurrentView,
      applySavedView,
      deleteSavedView,
    }),
    [
      workspace,
      ui,
      savedViews,
      filterFields,
      setGridSearch,
      setDensity,
      setHeatmapEnabled,
      setShowTotals,
      setFilterField,
      setZoneFields,
      addFieldToZone,
      removeFieldFromZone,
      setAggregator,
      setValueFilter,
      resetWorkspace,
      saveCurrentView,
      applySavedView,
      deleteSavedView,
    ],
  );

  return (
    <PricingPivotDataContext.Provider value={dataValue}>
      <PricingPivotWorkspaceContext.Provider value={workspaceValue}>
        {children}
      </PricingPivotWorkspaceContext.Provider>
    </PricingPivotDataContext.Provider>
  );
}

export function usePricingPivotDataContext(): PricingPivotDataContextValue {
  const context = useContext(PricingPivotDataContext);
  if (!context) {
    throw new Error("usePricingPivotDataContext must be used within PricingPivotProvider");
  }
  return context;
}

export function usePricingPivotWorkspaceContext(): PricingPivotWorkspaceContextValue {
  const context = useContext(PricingPivotWorkspaceContext);
  if (!context) {
    throw new Error("usePricingPivotWorkspaceContext must be used within PricingPivotProvider");
  }
  return context;
}

export function usePricingPivot(): PricingPivotContextValue {
  return { ...usePricingPivotDataContext(), ...usePricingPivotWorkspaceContext() };
}
