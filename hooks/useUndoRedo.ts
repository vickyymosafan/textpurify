import { useState, useCallback, useRef } from 'react';

export interface UndoRedoOptions {
  debounce?: number;
}

export interface UndoRedoState<T> {
  value: T;
  set: (newValue: T, forceHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (newValue: T) => void;
}

export function useUndoRedo<T>(initialState: T, options: UndoRedoOptions = {}): UndoRedoState<T> {
  const [present, setPresent] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  // We track the last "committed" state to history to calculate diffs or handle debounce
  const lastCommittedRef = useRef<T>(initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const undo = useCallback(() => {
    if (past.length === 0) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture(f => [present, ...f]);
    setPresent(previous);
    setPast(newPast);
    lastCommittedRef.current = previous;
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const next = future[0];
    const newFuture = future.slice(1);

    setPast(p => [...p, present]);
    setPresent(next);
    setFuture(newFuture);
    lastCommittedRef.current = next;
  }, [future, present]);

  const set = useCallback((newValue: T, forceHistory: boolean = false) => {
    // If value hasn't changed, do nothing
    if (newValue === present) return;

    setPresent(newValue);

    const commitToHistory = () => {
      setPast(p => [...p, lastCommittedRef.current]);
      setFuture([]);
      lastCommittedRef.current = newValue;
    };

    if (forceHistory || !options.debounce) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      commitToHistory();
    } else {
      // Debounce logic
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        commitToHistory();
        timeoutRef.current = null;
      }, options.debounce);
    }
  }, [present, options.debounce]);

  const reset = useCallback((newValue: T) => {
    setPresent(newValue);
    setPast([]);
    setFuture([]);
    lastCommittedRef.current = newValue;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    value: present,
    set,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    reset
  };
}