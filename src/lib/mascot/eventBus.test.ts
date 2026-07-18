import { expect, test } from "vitest";
import {
  emitMascotEvent,
  getMascotSuppression,
  resetMascotSuppressionForTests,
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

  expect(messages).toEqual(["Saved"]);
});

test("supports payload-free events", () => {
  let calls = 0;
  const unsubscribe = subscribeToMascotEvent("loading_finished", () => {
    calls += 1;
  });
  emitMascotEvent("loading_finished");
  unsubscribe();
  expect(calls).toBe(1);
});

test("suppression drops reactions until its cleanup runs", () => {
  resetMascotSuppressionForTests();
  let calls = 0;
  const unsubscribe = subscribeToMascotEvent("mascot_clicked", () => {
    calls += 1;
  });
  const resume = suppressMascot();
  emitMascotEvent("mascot_clicked");
  resume();
  emitMascotEvent("mascot_clicked");
  unsubscribe();
  expect(calls).toBe(1);
});

test("nested hidden and speech suppression is reference counted", () => {
  resetMascotSuppressionForTests();
  const releaseSpeech = suppressMascot({ hide: false, speech: true, reason: "dialog" });
  const releaseHidden = suppressMascot({ hide: true, reason: "payment" });
  expect(getMascotSuppression()).toEqual({ hidden: true, speech: true });
  releaseHidden();
  expect(getMascotSuppression()).toEqual({ hidden: false, speech: true });
  releaseSpeech();
  expect(getMascotSuppression()).toEqual({ hidden: false, speech: false });
});
