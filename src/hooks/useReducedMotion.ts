"use client";

import { useSyncExternalStore } from "react";
import { resolveReducedMotion } from "@/lib/mascot/motion";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", listener);
  return () => mediaQuery.removeEventListener("change", listener);
}

function getSnapshot(): boolean {
  return typeof window !== "undefined" && window.matchMedia(reducedMotionQuery).matches;
}

export function useReducedMotion(override: boolean | null = null): boolean {
  const systemPreference = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return resolveReducedMotion(systemPreference, override);
}
