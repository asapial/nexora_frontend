import assert from "node:assert/strict";
import test from "node:test";
import {
  canStartReaction,
  isReactionCoolingDown,
  MASCOT_REACTIONS,
} from "./reactions.ts";

test("higher-priority reactions interrupt lower-priority reactions", () => {
  assert.equal(
    canStartReaction(MASCOT_REACTIONS.thinking, MASCOT_REACTIONS.error),
    true,
  );
  assert.equal(
    canStartReaction(MASCOT_REACTIONS.error, MASCOT_REACTIONS.success),
    false,
  );
});

test("idle and sleeping are interruptible by user-visible reactions", () => {
  assert.equal(
    canStartReaction(MASCOT_REACTIONS.idle, MASCOT_REACTIONS.click),
    true,
  );
  assert.equal(
    canStartReaction(MASCOT_REACTIONS.sleeping, MASCOT_REACTIONS.success),
    true,
  );
});

test("achievement celebrations cannot be interrupted", () => {
  assert.equal(
    canStartReaction(MASCOT_REACTIONS.celebrating, MASCOT_REACTIONS.error),
    false,
  );
});

test("reaction cooldowns expire at their configured boundary", () => {
  const startedAt = 1_000;
  assert.equal(isReactionCoolingDown(MASCOT_REACTIONS.success, startedAt, 4_999), true);
  assert.equal(isReactionCoolingDown(MASCOT_REACTIONS.success, startedAt, 5_000), false);
  assert.equal(isReactionCoolingDown(MASCOT_REACTIONS.success, undefined, 5_000), false);
});

test("temporary and loading reactions have the expected lifecycle durations", () => {
  assert.equal(MASCOT_REACTIONS.success.durationMs, 700);
  assert.equal(MASCOT_REACTIONS.error.durationMs, 850);
  assert.equal(MASCOT_REACTIONS.thinking.durationMs, 0);
  assert.equal(MASCOT_REACTIONS.idle.durationMs, 0);
});
