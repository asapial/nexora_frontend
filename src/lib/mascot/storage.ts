import type { MascotPreferences } from "../../types/mascot.ts";
import {
  DEFAULT_MASCOT_PREFERENCES,
  MASCOT_STORAGE_KEY,
} from "./constants.ts";

export interface MascotStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const positions = new Set<MascotPreferences["position"]>([
  "bottom-left",
  "bottom-right",
]);
const interactionLevels = new Set<MascotPreferences["interactionLevel"]>([
  "quiet",
  "normal",
  "playful",
]);

export function validateMascotPreferences(value: unknown): MascotPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_MASCOT_PREFERENCES };
  }

  const candidate = value as Record<string, unknown>;
  return {
    enabled:
      typeof candidate.enabled === "boolean"
        ? candidate.enabled
        : DEFAULT_MASCOT_PREFERENCES.enabled,
    reducedMotionOverride:
      typeof candidate.reducedMotionOverride === "boolean" ||
      candidate.reducedMotionOverride === null
        ? candidate.reducedMotionOverride
        : DEFAULT_MASCOT_PREFERENCES.reducedMotionOverride,
    position: positions.has(candidate.position as MascotPreferences["position"])
      ? (candidate.position as MascotPreferences["position"])
      : DEFAULT_MASCOT_PREFERENCES.position,
    interactionLevel: interactionLevels.has(
      candidate.interactionLevel as MascotPreferences["interactionLevel"],
    )
      ? (candidate.interactionLevel as MascotPreferences["interactionLevel"])
      : DEFAULT_MASCOT_PREFERENCES.interactionLevel,
    speechEnabled:
      typeof candidate.speechEnabled === "boolean"
        ? candidate.speechEnabled
        : DEFAULT_MASCOT_PREFERENCES.speechEnabled,
  };
}

function browserStorage(): MascotStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadMascotPreferences(
  storage: MascotStorage | null = browserStorage(),
): MascotPreferences {
  if (!storage) return { ...DEFAULT_MASCOT_PREFERENCES };
  try {
    const stored = storage.getItem(MASCOT_STORAGE_KEY);
    return stored
      ? validateMascotPreferences(JSON.parse(stored) as unknown)
      : { ...DEFAULT_MASCOT_PREFERENCES };
  } catch {
    return { ...DEFAULT_MASCOT_PREFERENCES };
  }
}

export function saveMascotPreferences(
  preferences: MascotPreferences,
  storage: MascotStorage | null = browserStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(MASCOT_STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}
