import type { MascotReaction } from "../../types/mascot.ts";
import { MASCOT_MESSAGES, MASCOT_PRIORITY } from "./constants.ts";

export type MascotReactionId =
  | "idle"
  | "greeting"
  | "thinking"
  | "success"
  | "error"
  | "encouraging"
  | "celebrating"
  | "sleeping"
  | "click";

export const MASCOT_REACTIONS: Readonly<
  Record<MascotReactionId, MascotReaction>
> = {
  idle: {
    id: "idle",
    state: "idle",
    priority: MASCOT_PRIORITY.IDLE,
    durationMs: 0,
    cooldownMs: 0,
    messages: [],
    speechChance: 0,
    interruptible: true,
  },
  greeting: {
    id: "greeting",
    state: "greeting",
    priority: MASCOT_PRIORITY.ENCOURAGING,
    durationMs: 1200,
    cooldownMs: 0,
    messages: MASCOT_MESSAGES.greeting,
    speechChance: 0.45,
    interruptible: true,
  },
  thinking: {
    id: "thinking",
    state: "thinking",
    priority: MASCOT_PRIORITY.THINKING,
    durationMs: 0,
    cooldownMs: 500,
    messages: [],
    speechChance: 0,
    interruptible: true,
  },
  success: {
    id: "success",
    state: "success",
    priority: MASCOT_PRIORITY.SUCCESS,
    durationMs: 700,
    cooldownMs: 4000,
    messages: MASCOT_MESSAGES.success,
    speechChance: 0.25,
    interruptible: true,
  },
  error: {
    id: "error",
    state: "error",
    priority: MASCOT_PRIORITY.ERROR,
    durationMs: 850,
    cooldownMs: 5000,
    messages: MASCOT_MESSAGES.error,
    speechChance: 0.35,
    interruptible: true,
  },
  encouraging: {
    id: "encouraging",
    state: "encouraging",
    priority: MASCOT_PRIORITY.ENCOURAGING,
    durationMs: 900,
    cooldownMs: 5000,
    messages: MASCOT_MESSAGES.encouraging,
    speechChance: 0.3,
    interruptible: true,
  },
  celebrating: {
    id: "celebrating",
    state: "celebrating",
    priority: MASCOT_PRIORITY.CELEBRATING,
    durationMs: 1800,
    cooldownMs: 10000,
    messages: MASCOT_MESSAGES.celebrating,
    speechChance: 1,
    interruptible: false,
  },
  sleeping: {
    id: "sleeping",
    state: "sleeping",
    priority: MASCOT_PRIORITY.IDLE,
    durationMs: 0,
    cooldownMs: 0,
    messages: [],
    speechChance: 0,
    interruptible: true,
  },
  click: {
    id: "click",
    state: "curious",
    priority: MASCOT_PRIORITY.CURIOUS,
    durationMs: 720,
    cooldownMs: 3000,
    messages: MASCOT_MESSAGES.click,
    speechChance: 0.65,
    interruptible: true,
  },
};

export function canStartReaction(
  active: MascotReaction,
  next: MascotReaction,
): boolean {
  if (active.id === "idle" || active.id === "sleeping") return true;
  if (!active.interruptible) return false;
  return next.priority > active.priority;
}

export function isReactionCoolingDown(
  reaction: MascotReaction,
  lastStartedAt: number | undefined,
  now: number,
): boolean {
  return (
    lastStartedAt !== undefined &&
    reaction.cooldownMs > 0 &&
    now - lastStartedAt < reaction.cooldownMs
  );
}
