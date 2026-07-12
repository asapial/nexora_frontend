import assert from "node:assert/strict";
import test from "node:test";
import {
  emitMascotEvent,
  subscribeToMascotEvent,
  suppressMascot,
} from "./eventBus.ts";

test("dispatches typed payloads and unsubscribes", () => {
  const messages: string[] = [];
  const unsubscribe = subscribeToMascotEvent("action_success", (payload) => {
    messages.push(payload.message ?? "");
  });

  emitMascotEvent("action_success", { message: "Saved" });
  unsubscribe();
  emitMascotEvent("action_success", { message: "Ignored" });

  assert.deepEqual(messages, ["Saved"]);
});

test("supports payload-free events", () => {
  let calls = 0;
  const unsubscribe = subscribeToMascotEvent("loading_finished", () => {
    calls += 1;
  });
  emitMascotEvent("loading_finished");
  unsubscribe();
  assert.equal(calls, 1);
});

test("suppression drops reactions until its cleanup runs", () => {
  let calls = 0;
  const unsubscribe = subscribeToMascotEvent("mascot_clicked", () => {
    calls += 1;
  });
  const resume = suppressMascot();
  emitMascotEvent("mascot_clicked");
  resume();
  emitMascotEvent("mascot_clicked");
  unsubscribe();
  assert.equal(calls, 1);
});
