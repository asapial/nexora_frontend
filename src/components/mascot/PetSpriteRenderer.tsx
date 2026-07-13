import type { CSSProperties } from "react";
import type { MascotState } from "@/types/mascot";
import { getNimbiAnimation, NIMBI_MANIFEST } from "@/lib/mascot/manifest";
import styles from "./mascot.module.css";

const animationForState: Record<MascotState, string> = {
  idle: "idle",
  entering: "waving",
  greeting: "waving",
  waving: "waving",
  happy: "success",
  excited: "celebrating",
  reading: "reading",
  thinking: "thinking",
  writing: "writing",
  searching: "searching",
  uploading: "uploading",
  waiting: "waiting",
  success: "success",
  warning: "warning",
  offline: "error",
  pointing: "success",
  reviewing: "reviewing",
  notice: "waiting",
  error: "error",
  curious: "idle",
  encouraging: "success",
  celebrating: "celebrating",
  surprised: "warning",
  tickled: "waving",
  dizzy: "warning",
  sad: "error",
  crying: "error",
  recovering: "recovering",
  sleeping: "sleeping",
  chatting: "reading",
  gaming: "searching",
  dragging: "dragging",
  hidden: "idle"
};

interface PetSpriteRendererProps {
  state: MascotState;
  reducedMotion: boolean;
  isPressed?: boolean;
}

export function PetSpriteRenderer({
  state,
  reducedMotion,
  isPressed = false,
}: PetSpriteRendererProps) {
  const animationName = reducedMotion ? "idle" : animationForState[state];
  const animation = getNimbiAnimation(animationName);
  const x = (animation.column / (NIMBI_MANIFEST.columns - 1)) * 100;
  const y = (animation.row / (NIMBI_MANIFEST.rows - 1)) * 100;
  const style = {
    "--nimbi-sprite": `url(${reducedMotion ? NIMBI_MANIFEST.reducedMotionAsset : NIMBI_MANIFEST.asset})`,
    "--nimbi-x": `${x}%`,
    "--nimbi-y": `${y}%`,
  } as CSSProperties;

  return (
    <span
      aria-hidden="true"
      data-expression={animation.expression}
      className={`${styles.sprite} ${styles[`sprite${animationName[0].toUpperCase()}${animationName.slice(1)}`] ?? ""} ${
        reducedMotion ? styles.reducedMotion : ""
      } ${isPressed ? styles.pressed : ""}`}
      style={style}
    />
  );
}
