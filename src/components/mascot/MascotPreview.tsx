"use client";
import type { MascotPreferences } from "@/types/mascot";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { MascotSvg } from "./MascotSvg";
import styles from "./MascotPreview.module.css";
export function MascotPreview({preferences}:{preferences:MascotPreferences}){const reduced=useReducedMotion(preferences.reducedMotionOverride);return <div className={styles.preview} aria-label="Nimbi settings preview"><MascotSvg state={preferences.activityReactionsEnabled?"greeting":"idle"} reducedMotion={reduced}/><span>Live preview</span></div>}
