import { useId } from "react";
import type { MascotState } from "@/types/mascot";
import styles from "./mascot.module.css";

const classForState: Record<MascotState,string> = {
  idle:styles.stateIdle,greeting:styles.stateGreeting,happy:styles.stateSuccess,excited:styles.stateCelebrating,
  thinking:styles.stateThinking,success:styles.stateSuccess,error:styles.stateError,curious:styles.stateCurious,
  encouraging:styles.stateEncouraging,celebrating:styles.stateCelebrating,surprised:styles.stateSurprised,
  tickled:styles.stateTickled,dizzy:styles.stateDizzy,sad:styles.stateSad,crying:styles.stateCrying,
  recovering:styles.stateRecovering,sleeping:styles.stateSleeping,chatting:styles.stateChatting,
  gaming:styles.stateGaming,dragging:styles.stateDragging,hidden:styles.stateHidden,
};

export function MascotSvg({ state, reducedMotion, isPressed=false }: { state:MascotState; reducedMotion:boolean; isPressed?:boolean }) {
  const id=useId().replaceAll(":","");
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 120 154" className={`${styles.svg} ${classForState[state]} ${reducedMotion?styles.reducedMotion:""} ${isPressed?styles.pressed:""}`}>
    <defs><linearGradient id={`body-${id}`} x1="22" y1="28" x2="92" y2="124"><stop stopColor="var(--mascot-primary)"/><stop offset="1" stopColor="var(--mascot-secondary)"/></linearGradient><radialGradient id={`core-${id}`}><stop stopColor="#fff"/><stop offset=".45" stopColor="var(--mascot-glow)"/><stop offset="1" stopColor="var(--mascot-glow)" stopOpacity="0"/></radialGradient></defs>
    <ellipse className={styles.shadow} cx="60" cy="145" rx="31" ry="6"/>
    <g className={styles.particles}>{[[16,46],[28,18],[60,8],[91,20],[105,50],[94,91]].map(([cx,cy],i)=><circle key={i} className={styles[`particle${i+1}` as keyof typeof styles]} cx={cx} cy={cy} r="3"/>)}</g>
    <g className={styles.creature}>
      <g className={styles.legs}><g className={styles.leftLeg}><path d="M45 119 Q43 134 38 138"/><ellipse cx="35" cy="140" rx="10" ry="5"/></g><g className={styles.rightLeg}><path d="M75 119 Q77 134 82 138"/><ellipse cx="85" cy="140" rx="10" ry="5"/></g></g>
      <g className={styles.arms}><g className={styles.leftArm}><path d="M31 76 Q17 82 17 96"/><circle cx="17" cy="100" r="7"/><path className={styles.fingers} d="M12 98l-5 0M13 103l-4 3"/></g><g className={styles.rightArm}><path d="M89 76 Q103 82 103 96"/><circle cx="103" cy="100" r="7"/><path className={styles.fingers} d="M108 98l5 0M107 103l4 3"/></g></g>
      <path className={styles.torso} fill={`url(#body-${id})`} d="M35 73 Q60 60 85 73 L82 115 Q60 130 38 115Z"/>
      <circle className={styles.coreHalo} fill={`url(#core-${id})`} cx="60" cy="99" r="22"/><circle className={styles.core} cx="60" cy="99" r="7"/>
      <g className={styles.head}>
        <g className={styles.antennae}><path d="M44 35Q37 20 27 14"/><circle cx="25" cy="12" r="5"/><path d="M76 35Q83 20 93 14"/><circle cx="95" cy="12" r="5"/></g>
        <path className={styles.headShell} fill={`url(#body-${id})`} d="M60 27C87 27 101 43 96 66C92 83 79 91 60 91S28 83 24 66C19 43 33 27 60 27Z"/>
        <path className={styles.highlight} d="M35 42Q45 31 62 33Q39 39 32 60Q30 49 35 42Z"/>
        <g className={styles.brows}><path d="M38 47q8-5 15 0"/><path d="M67 47q8-5 15 0"/></g>
        <g className={styles.face}><g className={`${styles.eye} ${styles.leftEye}`}><ellipse cx="45" cy="59" rx="9" ry="10"/><circle className={styles.pupil} cx="47" cy="60" r="3.4"/><circle className={styles.eyeShine} cx="48" cy="57" r="1.3"/></g><g className={`${styles.eye} ${styles.rightEye}`}><ellipse cx="75" cy="59" rx="9" ry="10"/><circle className={styles.pupil} cx="77" cy="60" r="3.4"/><circle className={styles.eyeShine} cx="78" cy="57" r="1.3"/></g><path className={styles.mouth} d="M52 72Q60 79 68 72"/><circle className={styles.cheek} cx="34" cy="70" r="4"/><circle className={styles.cheek} cx="86" cy="70" r="4"/></g>
        <g className={styles.tears}><path d="M39 69q-5 8 0 12q5-4 0-12"/><path d="M81 69q-5 8 0 12q5-4 0-12"/></g>
        <g className={styles.dizzyStars}><path d="M30 36l2 4 4 1-4 2-1 4-2-4-4-1 4-2z"/><path d="M91 37l2 4 4 1-4 2-1 4-2-4-4-1 4-2z"/></g>
        <g className={styles.sleepMark}><text x="94" y="35">z</text><text x="103" y="24">Z</text></g>
      </g>
    </g>
  </svg>;
}
