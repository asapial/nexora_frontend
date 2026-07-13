import type { MascotPosition, MascotPreferences } from "../../types/mascot.ts";
import { DEFAULT_MASCOT_PREFERENCES, MASCOT_STORAGE_KEY, MASCOT_V1_STORAGE_KEY } from "./constants.ts";

export interface MascotStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const oneOf = <T extends string>(value: unknown, values: readonly T[], fallback: T): T =>
  values.includes(value as T) ? value as T : fallback;
const bool = (value: unknown, fallback: boolean) => typeof value === "boolean" ? value : fallback;

export function validateMascotPosition(value: unknown, fallback = DEFAULT_MASCOT_PREFERENCES.position): MascotPosition {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...fallback };
  const candidate = value as Record<string, unknown>;
  const ratio = typeof candidate.verticalRatio === "number" && Number.isFinite(candidate.verticalRatio)
    ? Math.min(1, Math.max(0, candidate.verticalRatio)) : fallback.verticalRatio;
  return { side: oneOf(candidate.side, ["left", "right"], fallback.side), verticalRatio: ratio };
}

export function validateMascotPreferences(value: unknown): MascotPreferences {
  const d = DEFAULT_MASCOT_PREFERENCES;
  if (!value || typeof value !== "object" || Array.isArray(value)) return structuredClone(d);
  const c = value as Record<string, unknown>;
  return {
    enabled: bool(c.enabled, d.enabled), speechEnabled: bool(c.speechEnabled, d.speechEnabled),
    autoInteractionsEnabled: bool(c.autoInteractionsEnabled, d.autoInteractionsEnabled),
    activityReactionsEnabled: bool(c.activityReactionsEnabled, d.activityReactionsEnabled),
    emotionalTapReactionsEnabled: bool(c.emotionalTapReactionsEnabled, d.emotionalTapReactionsEnabled),
    tapReactionSpeechEnabled: bool(c.tapReactionSpeechEnabled, d.tapReactionSpeechEnabled),
    dragEnabled: bool(c.dragEnabled, d.dragEnabled), rememberPosition: bool(c.rememberPosition, d.rememberPosition),
    chatEnabled: bool(c.chatEnabled, d.chatEnabled), ticTacToeEnabled: bool(c.ticTacToeEnabled, d.ticTacToeEnabled),
    reducedMotionOverride: typeof c.reducedMotionOverride === "boolean" || c.reducedMotionOverride === null ? c.reducedMotionOverride : d.reducedMotionOverride,
    position: validateMascotPosition(c.position),
    defaultSide: oneOf(c.defaultSide, ["left", "right"], d.defaultSide),
    size: oneOf(c.size, ["small", "medium", "large"], d.size),
    interactionLevel: oneOf(c.interactionLevel, ["quiet", "normal", "playful"], d.interactionLevel),
    emotionalIntensity: oneOf(c.emotionalIntensity, ["gentle", "expressive"], d.emotionalIntensity),
    learningRemindersEnabled: bool(c.learningRemindersEnabled, d.learningRemindersEnabled),
    celebrationsEnabled: bool(c.celebrationsEnabled, d.celebrationsEnabled),
    soundEnabled: bool(c.soundEnabled, d.soundEnabled),
    compactMobile: bool(c.compactMobile, d.compactMobile),
  };
}

export function migrateV1Preferences(value: unknown): MascotPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return structuredClone(DEFAULT_MASCOT_PREFERENCES);
  const c = value as Record<string, unknown>;
  const oldPosition = c.position === "bottom-left" ? "left" : c.position === "bottom-right" ? "right" : undefined;
  return validateMascotPreferences({ ...c, defaultSide: oldPosition, position: { side: oldPosition, verticalRatio: 0.82 } });
}

function browserStorage(): MascotStorage | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

export function loadMascotPreferences(storage: MascotStorage | null = browserStorage()): MascotPreferences {
  if (!storage) return structuredClone(DEFAULT_MASCOT_PREFERENCES);
  try {
    const v2 = storage.getItem(MASCOT_STORAGE_KEY);
    if (v2) return validateMascotPreferences(JSON.parse(v2) as unknown);
    const v1 = storage.getItem(MASCOT_V1_STORAGE_KEY);
    if (!v1) return structuredClone(DEFAULT_MASCOT_PREFERENCES);
    const migrated = migrateV1Preferences(JSON.parse(v1) as unknown);
    saveMascotPreferences(migrated, storage);
    return migrated;
  } catch { return structuredClone(DEFAULT_MASCOT_PREFERENCES); }
}

export function saveMascotPreferences(preferences: MascotPreferences, storage: MascotStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  try { storage.setItem(MASCOT_STORAGE_KEY, JSON.stringify(validateMascotPreferences(preferences))); return true; }
  catch { return false; }
}
