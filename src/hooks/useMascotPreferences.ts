"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { MascotPreferences } from "@/types/mascot";
import { DEFAULT_MASCOT_PREFERENCES, MASCOT_STORAGE_KEY } from "@/lib/mascot/constants";
import { loadMascotPreferences, saveMascotPreferences } from "@/lib/mascot/storage";

interface PreferencesSnapshot {
  preferences: MascotPreferences;
  ready: boolean;
}

const serverSnapshot: PreferencesSnapshot = {
  preferences: { ...DEFAULT_MASCOT_PREFERENCES },
  ready: false,
};
let currentSnapshot = serverSnapshot;
let hydrated = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function hydratePreferences(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  currentSnapshot = { preferences: loadMascotPreferences(), ready: true };
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): PreferencesSnapshot {
  return currentSnapshot;
}

function getServerSnapshot(): PreferencesSnapshot {
  return serverSnapshot;
}

export function useMascotPreferences() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydratePreferences();

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== MASCOT_STORAGE_KEY) return;
      currentSnapshot = { preferences: loadMascotPreferences(), ready: true };
      notify();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updatePreferences = useCallback(
    (updates: Partial<MascotPreferences>) => {
      const preferences = { ...currentSnapshot.preferences, ...updates };
      currentSnapshot = { preferences, ready: true };
      saveMascotPreferences(preferences);
      notify();
    },
    [],
  );

  const resetPreferences = useCallback(() => {
    const preferences = { ...DEFAULT_MASCOT_PREFERENCES };
    currentSnapshot = { preferences, ready: true };
    saveMascotPreferences(preferences);
    notify();
  }, []);

  return {
    preferences: snapshot.preferences,
    ready: snapshot.ready,
    updatePreferences,
    resetPreferences,
  };
}
