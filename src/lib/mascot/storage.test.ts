import assert from "node:assert/strict";
import test from "node:test";
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
  const preferences = { ...DEFAULT_MASCOT_PREFERENCES, position: { side: "left" as const, verticalRatio: 0.5 } };
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

test("version 1 preferences migrate once to the version 2 shape", () => {
  const storage = new MemoryStorage();
  storage.setItem(MASCOT_V1_STORAGE_KEY, JSON.stringify({ enabled: false, position: "bottom-left", speechEnabled: false, interactionLevel: "playful" }));
  const migrated = loadMascotPreferences(storage);
  assert.equal(migrated.enabled, false);
  assert.equal(migrated.position.side, "left");
  assert.equal(migrated.defaultSide, "left");
  assert.equal(migrated.chatEnabled, true);
  assert.deepEqual(loadMascotPreferences(storage), migrated);
});

test("invalid ratios and fields are clamped or replaced", () => {
  const storage = new MemoryStorage();
  storage.setItem(MASCOT_STORAGE_KEY, JSON.stringify({ position: { side: "top", verticalRatio: 4 }, size: "huge" }));
  const preferences = loadMascotPreferences(storage);
  assert.equal(preferences.position.side, DEFAULT_MASCOT_PREFERENCES.position.side);
  assert.equal(preferences.position.verticalRatio, 1);
  assert.equal(preferences.size, DEFAULT_MASCOT_PREFERENCES.size);
});
