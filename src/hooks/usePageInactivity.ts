"use client";

import { useEffect } from "react";
import { emitMascotEvent } from "@/lib/mascot/eventBus";
import { MASCOT_INACTIVITY_MS } from "@/lib/mascot/constants";

const POINTER_THROTTLE_MS = 15_000;

export function usePageInactivity(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    let timeoutIds: number[] = [];
    let lastActivityAt = Date.now();
    let lastPointerHandledAt = 0;
    let sleeping = false;

    const clearTimer = () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIds = [];
    };

    const scheduleSleep = () => {
      clearTimer();
      if (document.hidden) return;
      const elapsed = Date.now() - lastActivityAt;
      [20_000, 60_000, MASCOT_INACTIVITY_MS].forEach((milestone) => {
        timeoutIds.push(window.setTimeout(() => {
          if (milestone === MASCOT_INACTIVITY_MS) sleeping = true;
          emitMascotEvent("user_inactive", { durationMs: milestone });
        }, Math.max(0, milestone - elapsed)));
      });
    };

    const recordActivity = () => {
      const wasSleeping = sleeping;
      sleeping = false;
      lastActivityAt = Date.now();
      if (wasSleeping) emitMascotEvent("user_returned");
      scheduleSleep();
    };

    const handlePointerMove = () => {
      const now = Date.now();
      if (now - lastPointerHandledAt < POINTER_THROTTLE_MS) return;
      lastPointerHandledAt = now;
      recordActivity();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        clearTimer();
        return;
      }
      recordActivity();
    };

    const activityEvents: readonly (keyof DocumentEventMap)[] = [
      "pointerdown",
      "keydown",
      "focusin",
    ];
    activityEvents.forEach((eventName) =>
      document.addEventListener(eventName, recordActivity, { passive: true }),
    );
    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    scheduleSleep();

    return () => {
      clearTimer();
      activityEvents.forEach((eventName) =>
        document.removeEventListener(eventName, recordActivity),
      );
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled]);
}
