"use client";

import * as React from "react";

export type GridRowSelectionApi = {
  selectedKeys: Set<string>;
  hoveredKey: string | null;
  setHoveredKey: (key: string | null) => void;
  isSelected: (key: string) => boolean;
  toggle: (key: string) => void;
  selectKeys: (keys: string[]) => void;
  selectVisible: (keys: string[]) => void;
  clear: () => void;
  allSelected: (visibleKeys: string[]) => boolean;
  someSelected: (visibleKeys: string[]) => boolean;
  toggleAllVisible: (visibleKeys: string[]) => void;
  undoAvailable: boolean;
  undoLabel: string;
  undo: () => void;
  dismissUndo: () => void;
  recordSelectionUndo: (label: string) => void;
};

type UndoState = {
  keys: Set<string>;
  label: string;
};

export function useGridRowSelection(
  initialKeys: Set<string> = new Set(),
): GridRowSelectionApi {
  const [selectedKeys, setSelectedKeys] = React.useState(initialKeys);
  const [hoveredKey, setHoveredKey] = React.useState<string | null>(null);
  const [undoState, setUndoState] = React.useState<UndoState | null>(null);
  const selectedKeysRef = React.useRef(selectedKeys);
  selectedKeysRef.current = selectedKeys;

  const recordSelectionUndo = React.useCallback((label: string) => {
    setUndoState({
      keys: new Set(selectedKeysRef.current),
      label,
    });
  }, []);

  const applyKeys = React.useCallback((keys: Set<string>) => {
    setSelectedKeys(new Set(keys));
  }, []);

  const isSelected = React.useCallback(
    (key: string) => selectedKeys.has(key),
    [selectedKeys],
  );

  const toggle = React.useCallback((key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const selectKeys = React.useCallback((keys: string[]) => {
    applyKeys(new Set(keys));
  }, [applyKeys]);

  const selectVisible = React.useCallback(
    (keys: string[]) => {
      recordSelectionUndo("Previous selection restored");
      applyKeys(new Set(keys));
    },
    [applyKeys, recordSelectionUndo],
  );

  const clear = React.useCallback(() => {
    if (selectedKeysRef.current.size > 0) {
      recordSelectionUndo("Previous selection restored");
    }
    applyKeys(new Set());
  }, [applyKeys, recordSelectionUndo]);

  const allSelected = React.useCallback(
    (visibleKeys: string[]) =>
      visibleKeys.length > 0 && visibleKeys.every((key) => selectedKeys.has(key)),
    [selectedKeys],
  );

  const someSelected = React.useCallback(
    (visibleKeys: string[]) => {
      if (visibleKeys.length === 0) return false;
      const matched = visibleKeys.filter((key) => selectedKeys.has(key)).length;
      return matched > 0 && matched < visibleKeys.length;
    },
    [selectedKeys],
  );

  const toggleAllVisible = React.useCallback(
    (visibleKeys: string[]) => {
      recordSelectionUndo("Visible selection restored");
      if (allSelected(visibleKeys)) {
        applyKeys(new Set());
        return;
      }
      applyKeys(new Set(visibleKeys));
    },
    [allSelected, applyKeys, recordSelectionUndo],
  );

  const undo = React.useCallback(() => {
    if (!undoState) return;
    applyKeys(new Set(undoState.keys));
    setUndoState(null);
  }, [applyKeys, undoState]);

  const dismissUndo = React.useCallback(() => {
    setUndoState(null);
  }, []);

  return {
    selectedKeys,
    hoveredKey,
    setHoveredKey,
    isSelected,
    toggle,
    selectKeys,
    selectVisible,
    clear,
    allSelected,
    someSelected,
    toggleAllVisible,
    undoAvailable: undoState != null,
    undoLabel: undoState?.label ?? "",
    undo,
    dismissUndo,
    recordSelectionUndo,
  };
}
