"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MascotEmotion, MascotPanel, MascotPreferences, MascotReaction, MascotSpeech, MascotState } from "@/types/mascot";
import { getMascotSuppression, subscribeToMascotEvent } from "@/lib/mascot/eventBus";
import { canStartReaction, hitReactionForCount, isReactionCoolingDown, MASCOT_REACTIONS, type MascotReactionId } from "@/lib/mascot/reactions";
import { MascotTimer } from "@/lib/mascot/timer";
import { MASCOT_MESSAGES } from "@/lib/mascot/constants";

const LOGIN_SESSION_KEY = "nimbi:login-celebrated:v2";
interface StartOptions { message?: string; meaningful?: boolean; forceSpeech?: boolean; force?: boolean }

export function chooseRecentSafeMessage(messages: readonly string[], recent: readonly string[], random = Math.random): string | undefined {
  if (!messages.length) return undefined;
  const fresh = messages.filter((message) => !recent.includes(message));
  const pool = fresh.length ? fresh : messages;
  return pool[Math.floor(random() * pool.length)];
}

export function useMascotController(preferences: MascotPreferences) {
  const [state, setState] = useState<MascotState>("idle");
  const [emotion, setEmotion] = useState<MascotEmotion>("neutral");
  const [activePanel, setActivePanelState] = useState<MascotPanel>("closed");
  const [speech, setSpeech] = useState<MascotSpeech | null>(null);
  const preferencesRef = useRef(preferences);
  const activeRef = useRef<MascotReaction>(MASCOT_REACTIONS.idle);
  const [timer] = useState(() => new MascotTimer());
  const tokenRef = useRef(0);
  const cooldownsRef = useRef(new Map<string, number>());
  const recentRef = useRef<string[]>([]);
  const speechIdRef = useRef(0);
  const operationsRef = useRef(new Set<string>());
  const hitTimesRef = useRef<number[]>([]);
  useEffect(() => { preferencesRef.current = preferences; }, [preferences]);

  const resetToIdle = useCallback(() => {
    timer.cancel(); tokenRef.current += 1; activeRef.current = MASCOT_REACTIONS.idle;
    setState("idle"); setEmotion("neutral");
  }, [timer]);
  const dismissSpeech = useCallback(() => setSpeech(null), []);

  const startReaction = useCallback((id: MascotReactionId, options: StartOptions = {}) => {
    const next = MASCOT_REACTIONS[id]; const current = preferencesRef.current;
    if (!current.enabled) return false;
    if (current.interactionLevel === "quiet" && !["login","success","error","celebrating","click","chatting","gaming","dragging"].includes(id)) return false;
    const now = Date.now();
    if (!options.force && (isReactionCoolingDown(next, cooldownsRef.current.get(id), now) || !canStartReaction(activeRef.current, next))) return false;
    timer.cancel(); const token = ++tokenRef.current; activeRef.current = next; cooldownsRef.current.set(id, now);
    setState(next.state); setEmotion(next.emotion);
    const speechSuppressed = getMascotSuppression().speech;
    if (current.speechEnabled && !speechSuppressed) {
      const chance = current.interactionLevel === "playful" ? Math.min(1, next.speechChance * 1.5) : next.speechChance;
      if (options.message || options.forceSpeech || (current.interactionLevel !== "quiet" && Math.random() < chance)) {
        const message = options.message ?? chooseRecentSafeMessage(next.messages, recentRef.current);
        if (message) { recentRef.current = [...recentRef.current.slice(-3), message]; setSpeech({ id: ++speechIdRef.current, message: message.slice(0, 120), meaningful: options.meaningful ?? id !== "click", durationMs: id === "celebrating" || id === "login" ? 4000 : 3000 }); }
      }
    }
    if (next.durationMs > 0) timer.schedule(next.durationMs, () => {
      if (tokenRef.current !== token) return;
      if (id === "crying") {
        const recovery = MASCOT_REACTIONS.recovering;
        const recoveryToken = ++tokenRef.current;
        activeRef.current = recovery;
        setState(recovery.state);
        setEmotion(recovery.emotion);
        if (current.speechEnabled && current.tapReactionSpeechEnabled && !getMascotSuppression().speech) {
          const message = chooseRecentSafeMessage(recovery.messages, recentRef.current);
          if (message) setSpeech({ id: ++speechIdRef.current, message, meaningful: false, durationMs: 2400 });
        }
        timer.schedule(recovery.durationMs, () => { if (tokenRef.current === recoveryToken) resetToIdle(); });
      } else resetToIdle();
    });
    return true;
  }, [resetToIdle, timer]);

  const setActivePanel = useCallback((panel: MascotPanel) => {
    setActivePanelState(panel);
    if (panel === "chat") startReaction("chatting", { force: true });
    else if (panel === "tic-tac-toe") startReaction("gaming", { force: true });
    else if (panel === "closed" || panel === "actions" || panel === "quick-settings") resetToIdle();
  }, [resetToIdle, startReaction]);

  useEffect(() => {
    const unsubs = [
      subscribeToMascotEvent("app_ready", () => startReaction("greeting")),
      subscribeToMascotEvent("user_logged_in", ({ displayName }) => {
        let celebrated = false; try { celebrated = sessionStorage.getItem(LOGIN_SESSION_KEY) === "1"; if (!celebrated) sessionStorage.setItem(LOGIN_SESSION_KEY, "1"); } catch {}
        if (!celebrated) startReaction("login", { force: true, forceSpeech: true, message: displayName ? `Welcome back, ${displayName.split(" ")[0]}! Ready for an adventure?` : undefined });
      }),
      subscribeToMascotEvent("user_logged_out", () => startReaction("greeting", { force: true, message: "See you next time!", forceSpeech: true })),
      subscribeToMascotEvent("route_changed", () => { if (preferencesRef.current.interactionLevel === "playful") startReaction("surprised"); }),
      subscribeToMascotEvent("loading_started", ({ label, operationId }) => { operationsRef.current.add(operationId ?? "__default"); startReaction("thinking", label ? { message: label, meaningful: true } : {}); }),
      subscribeToMascotEvent("loading_finished", (payload) => { operationsRef.current.delete(payload?.operationId ?? "__default"); if (!operationsRef.current.size && activeRef.current.id === "thinking") resetToIdle(); }),
      subscribeToMascotEvent("action_success", ({ message }) => startReaction("success", { message, meaningful:true })),
      subscribeToMascotEvent("action_error", ({ message }) => startReaction("error", { message, meaningful:true })),
      subscribeToMascotEvent("task_completed", ({ taskName, progress }) => startReaction(progress === undefined || progress >= 100 ? "celebrating" : "encouraging", { message: taskName ? `${taskName} ${progress === undefined || progress >= 100 ? "complete!" : "is moving along."}` : undefined, meaningful:true })),
      subscribeToMascotEvent("achievement_unlocked", ({ title }) => startReaction("celebrating", { message:`${title} unlocked!`, forceSpeech:true, meaningful:true })),
      subscribeToMascotEvent("user_inactive", () => startReaction("sleeping")),
      subscribeToMascotEvent("user_returned", () => { if (activeRef.current.id === "sleeping") startReaction("recovering", { force:true }); }),
      subscribeToMascotEvent("mascot_clicked", () => startReaction("click", { meaningful:false })),
      subscribeToMascotEvent("mascot_double_tapped", () => startReaction("dizzy", { force:true, forceSpeech:preferencesRef.current.tapReactionSpeechEnabled })),
      subscribeToMascotEvent("mascot_hit", () => {
        if (!preferencesRef.current.emotionalTapReactionsEnabled) return;
        const now = Date.now(); hitTimesRef.current = [...hitTimesRef.current.filter((time) => now - time < 8000), now];
        const id = hitReactionForCount(hitTimesRef.current.length);
        startReaction(id, { force:true, forceSpeech:preferencesRef.current.tapReactionSpeechEnabled && (id === "dizzy" || id === "crying") });
      }),
      subscribeToMascotEvent("mascot_drag_started", () => startReaction("dragging", { force:true })),
      subscribeToMascotEvent("mascot_drag_ended", () => startReaction("recovering", { force:true })),
      subscribeToMascotEvent("chat_opened", () => setActivePanel("chat")),
      subscribeToMascotEvent("chat_response_started", () => startReaction("thinking", { force:true })),
      subscribeToMascotEvent("chat_response_finished", () => startReaction("chatting", { force:true })),
      subscribeToMascotEvent("chat_error", ({ message }) => startReaction("error", { force:true, message })),
      subscribeToMascotEvent("game_finished", ({ result }) => startReaction(result === "mascot-won" ? "celebrating" : result === "user-won" ? "success" : "dizzy", { force:true, forceSpeech:true, message: chooseRecentSafeMessage(result === "user-won" ? MASCOT_MESSAGES.gameUserWon : result === "mascot-won" ? MASCOT_MESSAGES.gameMascotWon : MASCOT_MESSAGES.gameDraw, []) })),
    ];
    return () => { unsubs.forEach((unsub) => unsub()); timer.cancel(); tokenRef.current += 1; };
  }, [resetToIdle, setActivePanel, startReaction, timer]);

  return { state, emotion, activePanel, speech, setActivePanel, dismissSpeech, resetToIdle };
}
