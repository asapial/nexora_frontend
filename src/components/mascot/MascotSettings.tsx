"use client";

import { useEffect, useRef, useState } from "react";
import { Settings2, X } from "lucide-react";
import type { MascotPreferences } from "@/types/mascot";
import styles from "./mascot.module.css";

interface MascotPreferencesFormProps {
  preferences: MascotPreferences;
  onChange: (updates: Partial<MascotPreferences>) => void;
  showEnabled?: boolean;
}

export function MascotPreferencesForm({
  preferences,
  onChange,
  showEnabled = true,
}: MascotPreferencesFormProps) {
  return (
    <div className={styles.settingsForm}>
      {showEnabled ? (
        <label className={styles.toggleRow}>
          <span>
            <strong>Show Nimbi</strong>
            <small>Display the floating mascot.</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.enabled}
            onChange={(event) => onChange({ enabled: event.target.checked })}
          />
        </label>
      ) : null}

      <label className={styles.field}>
        <span>Position</span>
        <select
          value={preferences.position}
          onChange={(event) =>
            onChange({
              position: event.target.value as MascotPreferences["position"],
            })
          }
        >
          <option value="bottom-right">Bottom right</option>
          <option value="bottom-left">Bottom left</option>
        </select>
      </label>

      <label className={styles.toggleRow}>
        <span>
          <strong>Speech bubbles</strong>
          <small>Show short, optional messages.</small>
        </span>
        <input
          type="checkbox"
          checked={preferences.speechEnabled}
          onChange={(event) => onChange({ speechEnabled: event.target.checked })}
        />
      </label>

      <label className={styles.field}>
        <span>Motion</span>
        <select
          value={
            preferences.reducedMotionOverride === null
              ? "system"
              : preferences.reducedMotionOverride
                ? "reduced"
                : "full"
          }
          onChange={(event) => {
            const value = event.target.value;
            onChange({
              reducedMotionOverride:
                value === "system" ? null : value === "reduced",
            });
          }}
        >
          <option value="system">Follow system</option>
          <option value="reduced">Reduced motion</option>
          <option value="full">Full motion</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>Interaction level</span>
        <select
          value={preferences.interactionLevel}
          onChange={(event) =>
            onChange({
              interactionLevel: event.target
                .value as MascotPreferences["interactionLevel"],
            })
          }
        >
          <option value="quiet">Quiet</option>
          <option value="normal">Normal</option>
          <option value="playful">Playful</option>
        </select>
      </label>
    </div>
  );
}

interface MascotSettingsProps extends MascotPreferencesFormProps {
  position: MascotPreferences["position"];
}

export function MascotSettings({
  preferences,
  onChange,
  position,
}: MascotSettingsProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        panelRef.current?.contains(event.target as Node) ||
        buttonRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setOpen(false);
      buttonRef.current?.focus();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.settingsRoot}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.settingsButton}
        aria-label="Nimbi settings"
        aria-expanded={open}
        aria-controls="nimbi-settings-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <Settings2 aria-hidden="true" />
      </button>
      {open ? (
        <div
          ref={panelRef}
          id="nimbi-settings-panel"
          className={`${styles.settingsPanel} ${
            position === "bottom-left" ? styles.settingsLeft : styles.settingsRight
          }`}
          role="dialog"
          aria-label="Nimbi preferences"
        >
          <div className={styles.settingsHeader}>
            <div>
              <strong>Nimbi</strong>
              <span>Mascot preferences</span>
            </div>
            <button
              type="button"
              aria-label="Close Nimbi settings"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <MascotPreferencesForm
            preferences={preferences}
            onChange={onChange}
          />
        </div>
      ) : null}
    </div>
  );
}
