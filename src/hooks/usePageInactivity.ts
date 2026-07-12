"use client";

import { useEffect } from "react";
import { emitMascotEvent } from "@/lib/mascot/eventBus";
import { MASCOT_INACTIVITY_MS } from "@/lib/mascot/constants";
import { remainingInactivityMs } from "@/lib/mascot/inactivity";

const POINTER_THROTTLE_MS = 15_000;

export function usePageInactivity(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    let timeoutId: number | undefined;
    let lastActivityAt = Date.now();
    let lastPointerHandledAt = 0;
    let sleeping = false;

    const clearTimer = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      timeoutId = undefined;
    };

    const scheduleSleep = () => {
      clearTimer();
      if (document.hidden) return;
      const remaining = remainingInactivityMs(
        lastActivityAt,
        Date.now(),
        MASCOT_INACTIVITY_MS,
      );
      timeoutId = window.setTimeout(() => {
        sleeping = true;
        emitMascotEvent("user_inactive", { durationMs: MASCOT_INACTIVITY_MS });
      }, remaining);
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
