"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  emitMascotEvent,
  getMascotSuppression,
  subscribeToMascotSuppression,
} from "@/lib/mascot/eventBus";
import { useMascotController } from "@/hooks/useMascotController";
import { useMascotPreferences } from "@/hooks/useMascotPreferences";
import { usePageInactivity } from "@/hooks/usePageInactivity";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMascotActivity } from "@/hooks/useMascotActivity";
import { useMascotDrag } from "@/hooks/useMascotDrag";
import { DEFAULT_MASCOT_PREFERENCES } from "@/lib/mascot/constants";
import { MascotActionMenu } from "./MascotActionMenu";
import { MascotPreferencesForm } from "./MascotSettings";
import { MascotSpeechBubble } from "./MascotSpeechBubble";
import { MascotSvg } from "./MascotSvg";
import styles from "./mascot.module.css";

const ChatPanel = dynamic(() => import("./MascotChatPanel"), {
  ssr: false,
  loading: () => null,
});
const GamePanel = dynamic(() => import("./MascotGamePanel"), {
  ssr: false,
  loading: () => null,
});

const suppressionServerSnapshot = { hidden: false, speech: false };

export function Mascot() {
  const pathname = usePathname();
  const { preferences, updatePreferences } = useMascotPreferences();
  const suppression = useSyncExternalStore(
    subscribeToMascotSuppression,
    getMascotSuppression,
    () => suppressionServerSnapshot,
  );
  const reducedMotion = useReducedMotion(preferences.reducedMotionOverride);
  const controller = useMascotController(preferences);
  const [pressed, setPressed] = useState(false);
  const lastTap = useRef(0);
  const hoverTimer = useRef<number | null>(null);
  const actionButton = useRef<HTMLButtonElement>(null);
  const mascotButton = useRef<HTMLButtonElement>(null);
  const isDefaultDock =
    preferences.position.side === preferences.defaultSide &&
    preferences.position.verticalRatio === DEFAULT_MASCOT_PREFERENCES.position.verticalRatio;
  const mascotPosition = !pathname.startsWith("/dashboard") && isDefaultDock
    ? { side: "right" as const, verticalRatio: 0.62 }
    : preferences.position;
  const drag = useMascotDrag({
    position: mascotPosition,
    enabled: preferences.dragEnabled,
    remember: preferences.rememberPosition,
    onSave: (position) => updatePreferences({ position }),
  });
  const active = preferences.enabled && !suppression.hidden;

  usePageInactivity(
    active &&
      preferences.autoInteractionsEnabled &&
      preferences.interactionLevel !== "quiet",
  );
  useMascotActivity(preferences, active);

  useEffect(() => {
    const id = window.setTimeout(() => emitMascotEvent("app_ready"), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (controller.activePanel === "closed") actionButton.current?.focus();
  }, [controller.activePanel]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && controller.activePanel !== "closed") {
        controller.setActivePanel("closed");
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [controller.activePanel, controller.setActivePanel]);

  useEffect(() => () => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
  }, []);

  if (!active || !drag.style) return null;

  const side = mascotPosition.side;
  const sizeClass =
    styles[
      `size${preferences.size[0].toUpperCase()}${preferences.size.slice(1)}` as keyof typeof styles
    ] ?? "";
  const closePanel = () => controller.setActivePanel("closed");
  const handleMascotClick = () => {
    if (drag.wasDrag()) return;
    const now = Date.now();
    const isDoubleTap = now - lastTap.current <= 450;
    if (isDoubleTap) {
      updatePreferences({
        position: {
          side: preferences.defaultSide,
          verticalRatio: DEFAULT_MASCOT_PREFERENCES.position.verticalRatio,
        },
      });
      emitMascotEvent("mascot_double_tapped");
    } else {
      emitMascotEvent("mascot_clicked");
    }
    lastTap.current = now;
  };

  return (
    <>
      <aside
        ref={drag.elementRef}
        style={drag.style}
        className={`${styles.container} ${side === "left" ? styles.sideLeft : ""} ${sizeClass} ${
          preferences.interactionLevel === "quiet"
            ? styles.levelQuiet
            : preferences.interactionLevel === "playful"
              ? styles.levelPlayful
              : ""
        } ${drag.isDragging ? styles.dragging : ""} ${drag.repositioning ? styles.repositioning : ""} ${
          controller.activePanel === "chat" ? styles.chatOpen : ""
        }`}
        aria-label="Nexora learning companion"
        data-mascot-state={controller.state}
      >
        {controller.speech && !suppression.speech ? (
          <MascotSpeechBubble
            speech={controller.speech}
            position={mascotPosition}
            onDismiss={controller.dismissSpeech}
          />
        ) : null}

        {controller.activePanel === "actions" ? (
          <MascotActionMenu
            preferences={preferences}
            onSelect={(panel) => {
              if (panel === "chat") emitMascotEvent("chat_opened");
              else controller.setActivePanel(panel);
            }}
            onMove={() => {
              closePanel();
              drag.beginKeyboardReposition();
              window.requestAnimationFrame(() => mascotButton.current?.focus());
            }}
            onHide={() => updatePreferences({ enabled: false })}
            onClose={closePanel}
          />
        ) : null}

        {controller.activePanel === "quick-settings" ? (
          <div className={styles.quickPanel} style={{ zIndex: 3 }}>
            <div className={styles.panelTitle}>
              <strong>Quick settings</strong>
              <button type="button" aria-label="Close settings" onClick={closePanel}>
                <X size={16} />
              </button>
            </div>
            <MascotPreferencesForm
              preferences={preferences}
              onChange={updatePreferences}
              showEnabled={false}
              onResetPosition={() =>
                updatePreferences({
                  position: {
                    side: preferences.defaultSide,
                    verticalRatio:
                      DEFAULT_MASCOT_PREFERENCES.position.verticalRatio,
                  },
                })
              }
            />
          </div>
        ) : null}

        <button
          ref={actionButton}
          type="button"
          className={styles.actionButton}
          style={{ zIndex: 2 }}
          aria-label="Open Nimbi actions"
          aria-expanded={controller.activePanel === "actions"}
          onClick={() =>
            controller.setActivePanel(
              controller.activePanel === "actions" ? "closed" : "actions",
            )
          }
        >
          <Menu />
        </button>
        <button
          ref={mascotButton}
          type="button"
          className={styles.mascotButton}
          aria-label={
            drag.repositioning
              ? "Reposition Nimbi. Use arrow keys, Enter to save, or Escape to cancel."
              : "Interact with Nimbi"
          }
          onPointerEnter={() => {
            if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
            hoverTimer.current = window.setTimeout(
              () => emitMascotEvent("mascot_hovered"),
              650,
            );
          }}
          onPointerLeave={() => {
            if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
            hoverTimer.current = null;
          }}
          onPointerDown={(event) => {
            setPressed(true);
            drag.onPointerDown(event);
          }}
          onPointerMove={drag.onPointerMove}
          onPointerUp={(event) => {
            setPressed(false);
            drag.onPointerUp(event);
          }}
          onPointerCancel={(event) => {
            setPressed(false);
            drag.onPointerCancel(event);
          }}
          onKeyDown={drag.onKeyDown}
          onClick={handleMascotClick}
        >
          <MascotSvg
            state={drag.isDragging ? "dragging" : controller.state}
            reducedMotion={reducedMotion}
            isPressed={pressed}
          />
        </button>
      </aside>
      {controller.activePanel === "chat" ? (
        <ChatPanel onClose={closePanel} />
      ) : null}
      {controller.activePanel === "tic-tac-toe" ? (
        <GamePanel onClose={closePanel} />
      ) : null}
    </>
  );
}
