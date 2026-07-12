"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MascotPreferences,
  MascotReaction,
  MascotSpeech,
  MascotState,
} from "@/types/mascot";
import { subscribeToMascotEvent } from "@/lib/mascot/eventBus";
import {
  canStartReaction,
  isReactionCoolingDown,
  MASCOT_REACTIONS,
  type MascotReactionId,
} from "@/lib/mascot/reactions";
import { MascotTimer } from "@/lib/mascot/timer";

const GREETING_SESSION_KEY = "nimbi:greeted:v1";

interface StartReactionOptions {
  message?: string;
  meaningful?: boolean;
  forceSpeech?: boolean;
}

function chooseUnrepeatedMessage(
  messages: readonly string[],
  previousMessage: string | undefined,
): string | undefined {
  if (messages.length === 0) return undefined;
  const candidates = messages.filter((message) => message !== previousMessage);
  const pool = candidates.length > 0 ? candidates : messages;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function useMascotController(preferences: MascotPreferences) {
  const [state, setState] = useState<MascotState>("idle");
  const [speech, setSpeech] = useState<MascotSpeech | null>(null);
  const preferencesRef = useRef(preferences);
  const activeReactionRef = useRef<MascotReaction>(MASCOT_REACTIONS.idle);
  const [reactionTimer] = useState(() => new MascotTimer());
  const reactionTokenRef = useRef(0);
  const cooldownsRef = useRef(new Map<string, number>());
  const lastMessagesRef = useRef(new Map<string, string>());
  const speechIdRef = useRef(0);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  const clearReactionTimer = useCallback(() => {
    reactionTimer.cancel();
  }, [reactionTimer]);

  const resetToIdle = useCallback(() => {
    clearReactionTimer();
    reactionTokenRef.current += 1;
    activeReactionRef.current = MASCOT_REACTIONS.idle;
    setState("idle");
  }, [clearReactionTimer]);

  const dismissSpeech = useCallback(() => setSpeech(null), []);

  const startReaction = useCallback(
    (reactionId: MascotReactionId, options: StartReactionOptions = {}) => {
      const reaction = MASCOT_REACTIONS[reactionId];
      const currentPreferences = preferencesRef.current;
      if (!currentPreferences.enabled) return false;
      if (
        currentPreferences.interactionLevel === "quiet" &&
        !["greeting", "success", "error", "celebrating", "click"].includes(reactionId)
      ) {
        return false;
      }

      const now = Date.now();
      if (
        isReactionCoolingDown(
          reaction,
          cooldownsRef.current.get(reaction.id),
          now,
        ) ||
        !canStartReaction(activeReactionRef.current, reaction)
      ) {
        return false;
      }

      clearReactionTimer();
      const token = ++reactionTokenRef.current;
      cooldownsRef.current.set(reaction.id, now);
      activeReactionRef.current = reaction;
      setState(reaction.state);

      if (currentPreferences.speechEnabled) {
        const chanceMultiplier =
          currentPreferences.interactionLevel === "playful" ? 1.55 : 1;
        const shouldSpeak =
          Boolean(options.message) ||
          options.forceSpeech ||
          (currentPreferences.interactionLevel !== "quiet" &&
            Math.random() < Math.min(1, reaction.speechChance * chanceMultiplier));
        if (shouldSpeak) {
          const message =
            options.message ??
            chooseUnrepeatedMessage(
              reaction.messages,
              lastMessagesRef.current.get(reaction.id),
            );
          if (message) {
            lastMessagesRef.current.set(reaction.id, message);
            setSpeech({
              id: ++speechIdRef.current,
              message: message.slice(0, 120),
              meaningful: options.meaningful ?? reactionId !== "click",
              durationMs: reactionId === "celebrating" ? 4000 : 3200,
            });
          }
        }
      }

      if (reaction.durationMs > 0) {
        reactionTimer.schedule(reaction.durationMs, () => {
          if (reactionTokenRef.current !== token) return;
          activeReactionRef.current = MASCOT_REACTIONS.idle;
          setState("idle");
        });
      }
      return true;
    },
    [clearReactionTimer, reactionTimer],
  );

  useEffect(() => {
    const unsubscribers = [
      subscribeToMascotEvent("app_ready", () => {
        let greeted = false;
        try {
          greeted = sessionStorage.getItem(GREETING_SESSION_KEY) === "1";
          if (!greeted) sessionStorage.setItem(GREETING_SESSION_KEY, "1");
        } catch {
          // Session storage is an enhancement only.
        }
        if (!greeted) startReaction("greeting");
      }),
      subscribeToMascotEvent("loading_started", ({ label }) => {
        startReaction("thinking", label ? { message: label, meaningful: true } : {});
      }),
      subscribeToMascotEvent("loading_finished", () => {
        if (activeReactionRef.current.id === "thinking") resetToIdle();
      }),
      subscribeToMascotEvent("action_success", ({ message }) => {
        startReaction("success", { message, meaningful: true });
      }),
      subscribeToMascotEvent("action_error", ({ message }) => {
        startReaction("error", { message, meaningful: true });
      }),
      subscribeToMascotEvent("task_completed", ({ taskName, progress }) => {
        const complete = progress === undefined || progress >= 100;
        startReaction(complete ? "celebrating" : "encouraging", {
          message: taskName ? `${taskName} ${complete ? "complete!" : "is moving along."}` : undefined,
          meaningful: true,
          forceSpeech: complete,
        });
      }),
      subscribeToMascotEvent("achievement_unlocked", ({ title }) => {
        startReaction("celebrating", {
          message: `${title} unlocked!`,
          meaningful: true,
          forceSpeech: true,
        });
      }),
      subscribeToMascotEvent("user_inactive", () => startReaction("sleeping")),
      subscribeToMascotEvent("user_returned", () => {
        if (activeReactionRef.current.id === "sleeping") resetToIdle();
      }),
      subscribeToMascotEvent("mascot_clicked", () => {
        startReaction("click", { meaningful: false });
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      clearReactionTimer();
      reactionTokenRef.current += 1;
    };
  }, [clearReactionTimer, resetToIdle, startReaction]);

  return { state, speech, dismissSpeech };
}
