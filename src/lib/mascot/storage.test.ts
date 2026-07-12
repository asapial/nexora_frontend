import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_MASCOT_PREFERENCES, MASCOT_STORAGE_KEY } from "./constants.ts";
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
  assert.deepEqual(loadMascotPreferences(storage), DEFAULT_MASCOT_PREFERENCES);
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
  assert.deepEqual(loadMascotPreferences(storage), {
    ...DEFAULT_MASCOT_PREFERENCES,
    enabled: false,
    speechEnabled: false,
    interactionLevel: "playful",
  });
});

test("settings changes persist immediately", () => {
  const storage = new MemoryStorage();
  const preferences = { ...DEFAULT_MASCOT_PREFERENCES, position: "bottom-left" as const };
  assert.equal(saveMascotPreferences(preferences, storage), true);
  assert.deepEqual(loadMascotPreferences(storage), preferences);
});

test("unavailable storage never crashes", () => {
  const unavailable: MascotStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  };
  assert.deepEqual(loadMascotPreferences(unavailable), DEFAULT_MASCOT_PREFERENCES);
  assert.equal(saveMascotPreferences({ ...DEFAULT_MASCOT_PREFERENCES }, unavailable), false);
});
