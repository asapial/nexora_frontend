import { useId } from "react";
import type { MascotState } from "@/types/mascot";
import styles from "./mascot.module.css";

interface MascotSvgProps {
  state: MascotState;
  reducedMotion: boolean;
  isPressed: boolean;
}

const stateClasses: Record<MascotState, string> = {
  idle: styles.stateIdle,
  greeting: styles.stateGreeting,
  thinking: styles.stateThinking,
  success: styles.stateSuccess,
  error: styles.stateError,
  curious: styles.stateCurious,
  encouraging: styles.stateEncouraging,
  celebrating: styles.stateCelebrating,
  sleeping: styles.stateSleeping,
  hidden: styles.stateHidden,
};

export function MascotSvg({ state, reducedMotion, isPressed }: MascotSvgProps) {
  const id = useId().replaceAll(":", "");
  const bodyGradientId = `nimbi-body-${id}`;
  const coreGradientId = `nimbi-core-${id}`;
  const glowId = `nimbi-glow-${id}`;

  return (
    <svg
      aria-hidden="true"
      className={`${styles.svg} ${stateClasses[state]} ${
        reducedMotion ? styles.reducedMotion : ""
      } ${isPressed ? styles.pressed : ""}`}
      viewBox="0 0 96 112"
      focusable="false"
    >
      <defs>
        <linearGradient id={bodyGradientId} x1="18" y1="18" x2="78" y2="87">
          <stop offset="0" stopColor="var(--mascot-primary)" />
          <stop offset="1" stopColor="var(--mascot-secondary)" />
        </linearGradient>
        <radialGradient id={coreGradientId}>
          <stop offset="0" stopColor="#fff" stopOpacity=".96" />
          <stop offset=".42" stopColor="var(--mascot-glow)" stopOpacity=".9" />
          <stop offset="1" stopColor="var(--mascot-glow)" stopOpacity="0" />
        </radialGradient>
        <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse className={styles.shadow} cx="48" cy="101" rx="23" ry="5" />

      <g className={styles.particles}>
        <circle className={styles.particleOne} cx="48" cy="44" r="2.5" />
        <circle className={styles.particleTwo} cx="48" cy="44" r="2" />
        <circle className={styles.particleThree} cx="48" cy="44" r="2" />
        <circle className={styles.particleFour} cx="48" cy="44" r="2.5" />
        <circle className={styles.particleFive} cx="48" cy="44" r="1.8" />
        <circle className={styles.particleSix} cx="48" cy="44" r="1.8" />
      </g>

      <g className={styles.creature}>
        <g className={styles.antennae}>
          <path d="M38 25 C34 17 28 14 27 9" />
          <circle cx="26.5" cy="7.5" r="3" />
          <path d="M58 25 C63 17 69 15 71 9" />
          <circle cx="71.5" cy="7.5" r="3" />
        </g>

        <g className={styles.hands}>
          <path className={styles.leftHand} d="M22 60 C12 59 10 51 13 47" />
          <path className={styles.rightHand} d="M74 60 C84 58 86 51 83 47" />
        </g>

        <path
          className={styles.body}
          d="M48 21 C67 21 79 35 77 57 C76 79 65 92 48 92 C30 92 19 79 19 58 C17 36 29 21 48 21Z"
          fill={`url(#${bodyGradientId})`}
          filter={`url(#${glowId})`}
        />
        <path
          className={styles.bodyHighlight}
          d="M31 32 C37 25 47 24 55 27 C40 28 29 41 28 56 C26 47 27 38 31 32Z"
        />

        <circle className={styles.coreHalo} cx="48" cy="69" r="17" fill={`url(#${coreGradientId})`} />
        <circle className={styles.core} cx="48" cy="69" r="5.4" />

        <g className={styles.face}>
          <g className={`${styles.eye} ${styles.leftEye}`}>
            <ellipse cx="36" cy="49" rx="7" ry="8" />
            <circle className={styles.pupil} cx="37.5" cy="50" r="2.6" />
            <circle className={styles.eyeShine} cx="38.5" cy="47.5" r="1" />
          </g>
          <g className={`${styles.eye} ${styles.rightEye}`}>
            <ellipse cx="60" cy="49" rx="7" ry="8" />
            <circle className={styles.pupil} cx="61.5" cy="50" r="2.6" />
            <circle className={styles.eyeShine} cx="62.5" cy="47.5" r="1" />
          </g>
          <path className={styles.mouth} d="M43 60 Q48 64 53 60" />
        </g>

        <g className={styles.sleepMark}>
          <circle cx="75" cy="28" r="2" />
          <circle cx="81" cy="21" r="3" />
        </g>
      </g>
    </svg>
  );
}
