"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

/**
 * Save-list — the user's local shortlist of tiles.
 *
 * Persisted in `sessionStorage` (survives in-tab navigation but not new tabs
 * or browser close — matches the "shortlist while browsing" intent without
 * committing to an account/cookie).
 *
 * Design notes:
 * - Reducer state is serialisable: `{ ids: string[] }`. Ordering is insertion
 *   order (most recent wins if toggled).
 * - Hydration is deferred to `useEffect` so SSR renders an empty list and
 *   the client patches it in on mount. This avoids a hydration mismatch.
 * - A DOM event bridge (`save-list:add`, `save-list:clear`) lets the agent bus
 *   drive the save list without importing this module — keeps coupling loose.
 *
 * This file is `.ts` not `.tsx` on purpose (spec deliverable). JSX would force
 * a rename; instead we use `createElement` for the one Provider node.
 */

const STORAGE_KEY = "the-tile:save-list";

export interface SaveListState {
  ids: string[];
}

type Action =
  | { type: "hydrate"; ids: string[] }
  | { type: "add"; id: string }
  | { type: "remove"; id: string }
  | { type: "toggle"; id: string }
  | { type: "clear" };

function reducer(state: SaveListState, action: Action): SaveListState {
  switch (action.type) {
    case "hydrate":
      return { ids: dedupe(action.ids) };
    case "add":
      if (state.ids.includes(action.id)) return state;
      return { ids: [...state.ids, action.id] };
    case "remove":
      if (!state.ids.includes(action.id)) return state;
      return { ids: state.ids.filter((x) => x !== action.id) };
    case "toggle":
      return state.ids.includes(action.id)
        ? { ids: state.ids.filter((x) => x !== action.id) }
        : { ids: [...state.ids, action.id] };
    case "clear":
      if (state.ids.length === 0) return state;
      return { ids: [] };
    default:
      return state;
  }
}

function dedupe(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || !id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const ids = (parsed as { ids?: unknown }).ids;
    if (!Array.isArray(ids)) return [];
    return dedupe(ids.filter((x): x is string => typeof x === "string"));
  } catch {
    return [];
  }
}

function writeStorage(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ids }));
  } catch {
    // Quota or private-mode failure — silently drop; the list still works in memory.
  }
}

export interface SaveListContextValue {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const SaveListContext = createContext<SaveListContextValue | null>(null);

export function SaveListProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ids: [] });
  const hydrated = useRef(false);

  // Hydrate from sessionStorage on mount.
  useEffect(() => {
    const fromStorage = readStorage();
    if (fromStorage.length > 0) {
      dispatch({ type: "hydrate", ids: fromStorage });
    }
    hydrated.current = true;
  }, []);

  // Persist on every change (after hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    writeStorage(state.ids);
  }, [state.ids]);

  // Cross-tab sync: another tab updating the storage keeps us in step.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      dispatch({ type: "hydrate", ids: readStorage() });
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Agent-bus bridge: fire DOM events to mutate the list without importing.
  useEffect(() => {
    function onAdd(event: Event) {
      const detail = (event as CustomEvent<{ productId?: unknown }>).detail;
      const productId = detail?.productId;
      if (typeof productId === "string" && productId.length > 0) {
        dispatch({ type: "add", id: productId });
      }
    }
    function onClear() {
      dispatch({ type: "clear" });
    }
    window.addEventListener("save-list:add", onAdd as EventListener);
    window.addEventListener("save-list:clear", onClear);
    return () => {
      window.removeEventListener("save-list:add", onAdd as EventListener);
      window.removeEventListener("save-list:clear", onClear);
    };
  }, []);

  const has = useCallback((id: string) => state.ids.includes(id), [state.ids]);
  const toggle = useCallback((id: string) => dispatch({ type: "toggle", id }), []);
  const add = useCallback((id: string) => dispatch({ type: "add", id }), []);
  const remove = useCallback((id: string) => dispatch({ type: "remove", id }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const value = useMemo<SaveListContextValue>(
    () => ({
      ids: state.ids,
      count: state.ids.length,
      has,
      toggle,
      add,
      remove,
      clear,
    }),
    [state.ids, has, toggle, add, remove, clear],
  );

  return createElement(SaveListContext.Provider, { value }, children);
}

export function useSaveList(): SaveListContextValue {
  const ctx = useContext(SaveListContext);
  if (!ctx) {
    throw new Error("useSaveList must be used inside <SaveListProvider>");
  }
  return ctx;
}
