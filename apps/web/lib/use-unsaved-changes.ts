"use client";
import { useEffect, useRef } from "react";

export function useUnsavedChanges<T>(initial: T, current: T, message = "You have unsaved changes. Leave anyway?") {
  const baselineRef = useRef(initial);
  const dirty = JSON.stringify(baselineRef.current) !== JSON.stringify(current);
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) { e.preventDefault(); e.returnValue = message; return message; }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, message]);
  return { dirty, markSaved: (newBaseline?: T) => { baselineRef.current = newBaseline ?? current; } };
}

export function useCmdS(handler: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); handler(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler]);
}
