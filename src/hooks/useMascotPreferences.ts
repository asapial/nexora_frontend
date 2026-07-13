"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { MascotPreferences } from "@/types/mascot";
import { getMascotPreferenceSnapshot, getMascotServerSnapshot, hydrateMascotPreferences, resetMascotPreferences, setMascotPreferences, subscribeToMascotPreferences } from "@/lib/mascot/preferenceStore";

export function useMascotPreferences() {
  const snapshot = useSyncExternalStore(subscribeToMascotPreferences, getMascotPreferenceSnapshot, getMascotServerSnapshot);
  useEffect(() => hydrateMascotPreferences(), []);
  const updatePreferences = useCallback((updates: Partial<MascotPreferences>) => setMascotPreferences(updates), []);
  const resetPreferences = useCallback(() => resetMascotPreferences(), []);
  return { preferences: snapshot.preferences, ready: snapshot.ready, updatePreferences, resetPreferences };
}
