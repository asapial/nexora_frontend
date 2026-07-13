"use client";

import { useCallback, useEffect, useState } from "react";
import type { MascotPreferences, MascotSpeech } from "@/types/mascot";
import { MascotTimer } from "@/lib/mascot/timer";
import styles from "./mascot.module.css";

interface MascotSpeechBubbleProps {
  speech: MascotSpeech;
  position: MascotPreferences["position"];
  onDismiss: () => void;
}

export function MascotSpeechBubble({
  speech,
  position,
  onDismiss,
}: MascotSpeechBubbleProps) {
  const [timer] = useState(() => new MascotTimer());

  const pauseTimer = useCallback(() => {
    timer.pause();
  }, [timer]);

  const startTimer = useCallback(() => {
    if (timer.pending) timer.resume();
    else timer.schedule(speech.durationMs, onDismiss);
  }, [onDismiss, speech.durationMs, timer]);

  useEffect(() => {
    timer.schedule(speech.durationMs, onDismiss);
    return () => timer.cancel();
  }, [onDismiss, speech.durationMs, speech.id, timer]);

  return (
    <div
      style={{ zIndex: 3 }}
      className={`${styles.speechBubble} ${
        position.side === "left" ? styles.speechLeft : styles.speechRight
      }`}
      role={speech.meaningful ? "status" : undefined}
      aria-live={speech.meaningful ? "polite" : undefined}
      onPointerEnter={pauseTimer}
      onPointerLeave={startTimer}
      onFocus={pauseTimer}
      onBlur={startTimer}
    >
      <span>{speech.message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss Nimbi’s message">
        ×
      </button>
    </div>
  );
}
