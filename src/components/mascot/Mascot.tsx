"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { emitMascotEvent, isMascotSuppressed, subscribeToMascotSuppression } from "@/lib/mascot/eventBus";
import { useMascotController } from "@/hooks/useMascotController";
import { useMascotPreferences } from "@/hooks/useMascotPreferences";
import { usePageInactivity } from "@/hooks/usePageInactivity";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { MascotSettings } from "./MascotSettings";
import { MascotSpeechBubble } from "./MascotSpeechBubble";
import { MascotSvg } from "./MascotSvg";
import styles from "./mascot.module.css";

export function Mascot() {
  const { preferences, updatePreferences } = useMascotPreferences();
  const reducedMotion = useReducedMotion(preferences.reducedMotionOverride);
  const suppressed = useSyncExternalStore(
    subscribeToMascotSuppression,
    isMascotSuppressed,
    () => false,
  );
  const { state, speech, dismissSpeech } = useMascotController(preferences);
  const [isPressed, setIsPressed] = useState(false);

  usePageInactivity(
    preferences.enabled &&
      !suppressed &&
      preferences.interactionLevel !== "quiet",
  );

  useEffect(() => {
    const id = window.setTimeout(() => emitMascotEvent("app_ready"), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!preferences.enabled || suppressed) return null;

  return (
    <aside
      className={`${styles.container} ${
        preferences.position === "bottom-left"
          ? styles.positionLeft
          : styles.positionRight
      } ${
        preferences.interactionLevel === "quiet"
          ? styles.levelQuiet
          : preferences.interactionLevel === "playful"
            ? styles.levelPlayful
            : ""
      }`}
      aria-label="Nimbi mascot"
      data-mascot-state={state}
    >
      {speech ? (
        <MascotSpeechBubble
          speech={speech}
          position={preferences.position}
          onDismiss={dismissSpeech}
        />
      ) : null}
      <div className={styles.controls}>
        <MascotSettings
          preferences={preferences}
          position={preferences.position}
          onChange={updatePreferences}
        />
        <button
          type="button"
          className={styles.mascotButton}
          aria-label="Interact with Nimbi"
          onPointerDown={() => setIsPressed(true)}
          onPointerUp={() => setIsPressed(false)}
          onPointerCancel={() => setIsPressed(false)}
          onPointerLeave={() => setIsPressed(false)}
          onClick={() => emitMascotEvent("mascot_clicked")}
        >
          <MascotSvg
            state={state}
            reducedMotion={reducedMotion}
            isPressed={isPressed}
          />
        </button>
      </div>
    </aside>
  );
}
