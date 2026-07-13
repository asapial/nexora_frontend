import type { MascotPreferences } from "../../types/mascot.ts";
import { DEFAULT_MASCOT_PREFERENCES, MASCOT_STORAGE_KEY } from "./constants.ts";
import { loadMascotPreferences, saveMascotPreferences, validateMascotPreferences } from "./storage.ts";

export interface MascotPreferenceSnapshot { preferences: MascotPreferences; ready: boolean }
const serverSnapshot: MascotPreferenceSnapshot = { preferences: structuredClone(DEFAULT_MASCOT_PREFERENCES), ready: false };
let snapshot = serverSnapshot;
let hydrated = false;
let storageListening = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function hydrateMascotPreferences(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  snapshot = { preferences: loadMascotPreferences(), ready: true };
  if (!storageListening) {
    storageListening = true;
    window.addEventListener("storage", (event) => {
      if (event.key !== MASCOT_STORAGE_KEY) return;
      snapshot = { preferences: loadMascotPreferences(), ready: true };
      notify();
    });
  }
  notify();
}

export const getMascotPreferenceSnapshot = () => snapshot;
export const getMascotServerSnapshot = () => serverSnapshot;
export const getMascotPreferences = () => snapshot.preferences;
export function subscribeToMascotPreferences(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function setMascotPreferences(updates: Partial<MascotPreferences> | MascotPreferences): MascotPreferences {
  const preferences = validateMascotPreferences({ ...snapshot.preferences, ...updates });
  snapshot = { preferences, ready: true };
  saveMascotPreferences(preferences);
  notify();
  return preferences;
}
export function resetMascotPreferences(): MascotPreferences { return setMascotPreferences(structuredClone(DEFAULT_MASCOT_PREFERENCES)); }
