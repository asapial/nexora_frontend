import type { MascotReaction } from "../../types/mascot.ts";
import { MASCOT_MESSAGES, MASCOT_PRIORITY } from "./constants.ts";

export type MascotReactionId = "idle" | "entering" | "greeting" | "waving" | "login" | "reading" | "thinking" | "writing" | "searching" | "uploading" | "waiting" | "success" | "warning" | "error" | "offline" | "reviewing" | "notice" | "encouraging" | "celebrating" | "sleeping" | "click" | "surprised" | "dizzy" | "sad" | "crying" | "recovering" | "chatting" | "gaming" | "dragging";
const reaction = (value: MascotReaction) => value;
export const MASCOT_REACTIONS: Readonly<Record<MascotReactionId, MascotReaction>> = {
  idle: reaction({ id:"idle", state:"idle", emotion:"neutral", priority:MASCOT_PRIORITY.IDLE, durationMs:0, cooldownMs:0, messages:[], speechChance:0, interruptible:true }),
  entering: reaction({ id:"entering", state:"entering", emotion:"joyful", priority:MASCOT_PRIORITY.ENCOURAGING, durationMs:1200, cooldownMs:0, messages:[], speechChance:0, interruptible:true }),
  greeting: reaction({ id:"greeting", state:"greeting", emotion:"joyful", priority:MASCOT_PRIORITY.ENCOURAGING, durationMs:1200, cooldownMs:0, messages:MASCOT_MESSAGES.greeting, speechChance:.45, interruptible:true }),
  waving: reaction({ id:"waving", state:"waving", emotion:"joyful", priority:MASCOT_PRIORITY.CLICK, durationMs:1100, cooldownMs:1200, messages:MASCOT_MESSAGES.greeting, speechChance:.15, interruptible:true }),
  login: reaction({ id:"login", state:"celebrating", emotion:"joyful", priority:MASCOT_PRIORITY.LOGIN, durationMs:2200, cooldownMs:0, messages:MASCOT_MESSAGES.login, speechChance:1, interruptible:false }),
  reading: reaction({ id:"reading", state:"reading", emotion:"focused", priority:MASCOT_PRIORITY.ENCOURAGING, durationMs:1800, cooldownMs:15000, messages:[], speechChance:0, interruptible:true }),
  thinking: reaction({ id:"thinking", state:"thinking", emotion:"focused", priority:MASCOT_PRIORITY.THINKING, durationMs:0, cooldownMs:300, messages:[], speechChance:0, interruptible:true }),
  writing: reaction({ id:"writing", state:"writing", emotion:"focused", priority:MASCOT_PRIORITY.ENCOURAGING, durationMs:1800, cooldownMs:15000, messages:[], speechChance:0, interruptible:true }),
  searching: reaction({ id:"searching", state:"searching", emotion:"focused", priority:MASCOT_PRIORITY.ENCOURAGING, durationMs:1800, cooldownMs:15000, messages:[], speechChance:0, interruptible:true }),
  uploading: reaction({ id:"uploading", state:"uploading", emotion:"focused", priority:MASCOT_PRIORITY.THINKING, durationMs:0, cooldownMs:300, messages:[], speechChance:0, interruptible:true }),
  waiting: reaction({ id:"waiting", state:"waiting", emotion:"focused", priority:MASCOT_PRIORITY.THINKING, durationMs:1800, cooldownMs:8000, messages:[], speechChance:0, interruptible:true }),
  success: reaction({ id:"success", state:"success", emotion:"joyful", priority:MASCOT_PRIORITY.SUCCESS, durationMs:750, cooldownMs:4000, messages:MASCOT_MESSAGES.success, speechChance:.3, interruptible:true }),
  error: reaction({ id:"error", state:"error", emotion:"concerned", priority:MASCOT_PRIORITY.ERROR, durationMs:1100, cooldownMs:5000, messages:MASCOT_MESSAGES.error, speechChance:.4, interruptible:true }),
  warning: reaction({ id:"warning", state:"warning", emotion:"concerned", priority:MASCOT_PRIORITY.SUCCESS, durationMs:1400, cooldownMs:30000, messages:MASCOT_MESSAGES.encouraging, speechChance:.25, interruptible:true }),
  offline: reaction({ id:"offline", state:"offline", emotion:"concerned", priority:MASCOT_PRIORITY.CRITICAL_UI, durationMs:0, cooldownMs:0, messages:["You appear to be offline. I’ll wait here while the connection returns."], speechChance:1, interruptible:false }),
  reviewing: reaction({ id:"reviewing", state:"reviewing", emotion:"focused", priority:MASCOT_PRIORITY.ENCOURAGING, durationMs:1800, cooldownMs:15000, messages:[], speechChance:0, interruptible:true }),
  notice: reaction({ id:"notice", state:"notice", emotion:"neutral", priority:MASCOT_PRIORITY.SUCCESS, durationMs:1500, cooldownMs:15000, messages:["A new notice is available."], speechChance:.5, interruptible:true }),
  encouraging: reaction({ id:"encouraging", state:"encouraging", emotion:"joyful", priority:MASCOT_PRIORITY.ENCOURAGING, durationMs:900, cooldownMs:300000, messages:MASCOT_MESSAGES.encouraging, speechChance:.35, interruptible:true }),
  celebrating: reaction({ id:"celebrating", state:"celebrating", emotion:"joyful", priority:MASCOT_PRIORITY.CELEBRATING, durationMs:1800, cooldownMs:10000, messages:MASCOT_MESSAGES.celebrating, speechChance:1, interruptible:false }),
  sleeping: reaction({ id:"sleeping", state:"sleeping", emotion:"sleepy", priority:MASCOT_PRIORITY.IDLE, durationMs:0, cooldownMs:0, messages:[], speechChance:0, interruptible:true }),
  click: reaction({ id:"click", state:"tickled", emotion:"playful", priority:MASCOT_PRIORITY.CLICK, durationMs:520, cooldownMs:350, messages:MASCOT_MESSAGES.click, speechChance:.55, interruptible:true }),
  surprised: reaction({ id:"surprised", state:"surprised", emotion:"playful", priority:MASCOT_PRIORITY.CLICK, durationMs:500, cooldownMs:250, messages:MASCOT_MESSAGES.click, speechChance:.35, interruptible:true }),
  dizzy: reaction({ id:"dizzy", state:"dizzy", emotion:"playful", priority:MASCOT_PRIORITY.SAD, durationMs:900, cooldownMs:700, messages:MASCOT_MESSAGES.dizzy, speechChance:.8, interruptible:true }),
  sad: reaction({ id:"sad", state:"sad", emotion:"sad", priority:MASCOT_PRIORITY.SAD, durationMs:1500, cooldownMs:1000, messages:MASCOT_MESSAGES.sad, speechChance:.65, interruptible:true }),
  crying: reaction({ id:"crying", state:"crying", emotion:"sad", priority:MASCOT_PRIORITY.CRYING, durationMs:3000, cooldownMs:8000, messages:MASCOT_MESSAGES.sad, speechChance:.75, interruptible:false }),
  recovering: reaction({ id:"recovering", state:"recovering", emotion:"neutral", priority:MASCOT_PRIORITY.SAD, durationMs:1200, cooldownMs:0, messages:MASCOT_MESSAGES.recovering, speechChance:.8, interruptible:true }),
  chatting: reaction({ id:"chatting", state:"chatting", emotion:"focused", priority:MASCOT_PRIORITY.CRITICAL_UI, durationMs:0, cooldownMs:0, messages:MASCOT_MESSAGES.chat, speechChance:0, interruptible:false }),
  gaming: reaction({ id:"gaming", state:"gaming", emotion:"focused", priority:MASCOT_PRIORITY.CRITICAL_UI, durationMs:0, cooldownMs:0, messages:[], speechChance:0, interruptible:false }),
  dragging: reaction({ id:"dragging", state:"dragging", emotion:"focused", priority:MASCOT_PRIORITY.CRITICAL_UI, durationMs:0, cooldownMs:0, messages:[], speechChance:0, interruptible:false }),
};

export function canStartReaction(active: MascotReaction, next: MascotReaction): boolean {
  if (active.id === next.id && next.durationMs === 0) return true;
  if (active.id === "idle" || active.id === "sleeping") return true;
  if (!active.interruptible) return false;
  return next.priority > active.priority;
}
export function isReactionCoolingDown(reaction: MascotReaction, lastStartedAt: number | undefined, now: number): boolean {
  return lastStartedAt !== undefined && reaction.cooldownMs > 0 && now - lastStartedAt < reaction.cooldownMs;
}

export function hitReactionForCount(count: number): MascotReactionId {
  if (count >= 6) return "crying";
  if (count >= 3) return "sad";
  if (count >= 2) return "dizzy";
  return "surprised";
}
