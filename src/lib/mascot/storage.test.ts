import { expect, test } from "vitest";
import { DEFAULT_MASCOT_PREFERENCES, MASCOT_STORAGE_KEY, MASCOT_V1_STORAGE_KEY } from "./constants.ts";
import {
  loadMascotPreferences,
  saveMascotPreferences,
  type MascotStorage,
} from "./storage.ts";

class MemoryStorage implements MascotStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test("invalid JSON safely falls back to defaults", () => {
  const storage = new MemoryStorage();
  storage.setItem(MASCOT_STORAGE_KEY, "{not-json");
  expect(loadMascotPreferences(storage)).toEqual(DEFAULT_MASCOT_PREFERENCES);
});

test("validation merges known values and ignores malformed or unknown fields", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    MASCOT_STORAGE_KEY,
    JSON.stringify({
      enabled: false,
      position: "top-left",
      speechEnabled: false,
      interactionLevel: "playful",
      unknown: "ignored",
    }),
  );
  expect(loadMascotPreferences(storage)).toEqual({
    ...DEFAULT_MASCOT_PREFERENCES,
    enabled: false,
    speechEnabled: false,
    interactionLevel: "playful",
  });
});

test("settings changes persist immediately", () => {
  const storage = new MemoryStorage();
  const preferences = { ...DEFAULT_MASCOT_PREFERENCES, position: { side: "left" as const, verticalRatio: 0.5 } };
  expect(saveMascotPreferences(preferences, storage)).toBe(true);
  expect(loadMascotPreferences(storage)).toEqual(preferences);
});

test("unavailable storage never crashes", () => {
  const unavailable: MascotStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  };
  expect(loadMascotPreferences(unavailable)).toEqual(DEFAULT_MASCOT_PREFERENCES);
  expect(saveMascotPreferences({ ...DEFAULT_MASCOT_PREFERENCES }, unavailable)).toBe(false);
});

test("version 1 preferences migrate once to the version 2 shape", () => {
  const storage = new MemoryStorage();
  storage.setItem(MASCOT_V1_STORAGE_KEY, JSON.stringify({ enabled: false, position: "bottom-left", speechEnabled: false, interactionLevel: "playful" }));
  const migrated = loadMascotPreferences(storage);
  expect(migrated.enabled).toBe(false);
  expect(migrated.position.side).toBe("left");
  expect(migrated.defaultSide).toBe("left");
  expect(migrated.chatEnabled).toBe(true);
  expect(loadMascotPreferences(storage)).toEqual(migrated);
});

test("invalid ratios and fields are clamped or replaced", () => {
  const storage = new MemoryStorage();
  storage.setItem(MASCOT_STORAGE_KEY, JSON.stringify({ position: { side: "top", verticalRatio: 4 }, size: "huge" }));
  const preferences = loadMascotPreferences(storage);
  expect(preferences.position.side).toBe(DEFAULT_MASCOT_PREFERENCES.position.side);
  expect(preferences.position.verticalRatio).toBe(1);
  expect(preferences.size).toBe(DEFAULT_MASCOT_PREFERENCES.size);
});
