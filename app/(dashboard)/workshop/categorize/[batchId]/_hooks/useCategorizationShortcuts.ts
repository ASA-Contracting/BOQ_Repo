"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UndoEntry = {
  itemId: number;
  previousFamilyId: number | null;
  newFamilyId: number | null;
};

export function useCategorizationUndo() {
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [redoStack, setRedoStack] = useState<UndoEntry[]>([]);

  const pushChange = useCallback((entry: UndoEntry) => {
    setUndoStack((current) => [...current, entry]);
    setRedoStack([]);
  }, []);

  const undo = useCallback((): UndoEntry | null => {
    let entry: UndoEntry | null = null;
    setUndoStack((current) => {
      if (current.length === 0) {
        return current;
      }
      entry = current[current.length - 1] ?? null;
      return current.slice(0, -1);
    });
    if (entry) {
      setRedoStack((current) => [...current, entry as UndoEntry]);
    }
    return entry;
  }, []);

  const redo = useCallback((): UndoEntry | null => {
    let entry: UndoEntry | null = null;
    setRedoStack((current) => {
      if (current.length === 0) {
        return current;
      }
      entry = current[current.length - 1] ?? null;
      return current.slice(0, -1);
    });
    if (entry) {
      setUndoStack((current) => [...current, entry as UndoEntry]);
    }
    return entry;
  }, []);

  return {
    pushChange,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}

export function useCategorizationShortcuts(options: {
  enabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  onSaveAndNext: () => void;
  onSkip: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAcceptSuggestion: (index: number) => void;
}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    };

    const handler = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      const opts = optionsRef.current;
      const mod = event.metaKey || event.ctrlKey;

      if (event.key === "ArrowLeft" || event.key === "h") {
        event.preventDefault();
        opts.onPrevious();
        return;
      }

      if (event.key === "ArrowRight" || event.key === "l") {
        event.preventDefault();
        opts.onNext();
        return;
      }

      if (mod && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        opts.onUndo();
        return;
      }

      if (mod && (event.key.toLowerCase() === "z" && event.shiftKey || event.key.toLowerCase() === "y")) {
        event.preventDefault();
        opts.onRedo();
        return;
      }

      if (mod && event.key === "Enter") {
        event.preventDefault();
        opts.onSaveAndNext();
        return;
      }

      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        opts.onSave();
        return;
      }

      if (event.key === "Enter" && !mod) {
        event.preventDefault();
        opts.onAcceptSuggestion(0);
        return;
      }

      if (/^[1-3]$/.test(event.key)) {
        event.preventDefault();
        opts.onAcceptSuggestion(Number(event.key) - 1);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [options.enabled]);
}
