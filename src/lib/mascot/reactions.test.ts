import { expect, test } from "vitest";
import {
  canStartReaction,
  hitReactionForCount,
  isReactionCoolingDown,
  MASCOT_REACTIONS,
} from "./reactions.ts";

test("higher-priority reactions interrupt lower-priority reactions", () => {
  expect(canStartReaction(MASCOT_REACTIONS.thinking, MASCOT_REACTIONS.error)).toBe(true);
  expect(canStartReaction(MASCOT_REACTIONS.error, MASCOT_REACTIONS.success)).toBe(false);
});

test("idle and sleeping are interruptible by user-visible reactions", () => {
  expect(canStartReaction(MASCOT_REACTIONS.idle, MASCOT_REACTIONS.click)).toBe(true);
  expect(canStartReaction(MASCOT_REACTIONS.sleeping, MASCOT_REACTIONS.success)).toBe(true);
});

test("achievement celebrations cannot be interrupted", () => {
  expect(canStartReaction(MASCOT_REACTIONS.celebrating, MASCOT_REACTIONS.error)).toBe(false);
});

test("reaction cooldowns expire at their configured boundary", () => {
  const startedAt = 1_000;
  expect(isReactionCoolingDown(MASCOT_REACTIONS.success, startedAt, 4_999)).toBe(true);
  expect(isReactionCoolingDown(MASCOT_REACTIONS.success, startedAt, 5_000)).toBe(false);
  expect(isReactionCoolingDown(MASCOT_REACTIONS.success, undefined, 5_000)).toBe(false);
});

test("temporary and loading reactions have the expected lifecycle durations", () => {
  expect(MASCOT_REACTIONS.success.durationMs).toBe(750);
  expect(MASCOT_REACTIONS.error.durationMs).toBe(1100);
  expect(MASCOT_REACTIONS.thinking.durationMs).toBe(0);
  expect(MASCOT_REACTIONS.idle.durationMs).toBe(0);
});

test("repeated taps progress through the controlled emotional arc", () => {
  expect(hitReactionForCount(1)).toBe("surprised");
  expect(hitReactionForCount(2)).toBe("dizzy");
  expect(hitReactionForCount(3)).toBe("sad");
  expect(hitReactionForCount(6)).toBe("crying");
});
