"use client";

import type { MascotPreferences } from "@/types/mascot";
import styles from "./mascot.module.css";

interface Props { preferences: MascotPreferences; onChange: (updates: Partial<MascotPreferences>) => void; showEnabled?: boolean; onResetPosition?: () => void }
const Toggle = ({ title, detail, checked, onChange }: { title:string; detail?:string; checked:boolean; onChange:(checked:boolean)=>void }) => (
  <label className={styles.toggleRow}><span><strong>{title}</strong>{detail ? <small>{detail}</small> : null}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>
);

export function MascotPreferencesForm({ preferences:p, onChange, showEnabled=true, onResetPosition }: Props) {
  return <div className={styles.settingsForm}>
    {showEnabled ? <Toggle title="Enable Nimbi" detail="Show the companion across supported pages." checked={p.enabled} onChange={(enabled)=>onChange({enabled})} /> : null}
    <Toggle title="Automatic reactions" detail="React to meaningful app activity." checked={p.activityReactionsEnabled} onChange={(activityReactionsEnabled)=>onChange({activityReactionsEnabled, autoInteractionsEnabled:activityReactionsEnabled})} />
    <Toggle title="Speech bubbles" detail="Show short local personality messages." checked={p.speechEnabled} onChange={(speechEnabled)=>onChange({speechEnabled})} />
    <label className={styles.field}><span>Interaction level</span><select value={p.interactionLevel} onChange={(e)=>onChange({interactionLevel:e.target.value as MascotPreferences["interactionLevel"]})}><option value="quiet">Quiet</option><option value="normal">Normal</option><option value="playful">Playful</option></select></label>
    <label className={styles.field}><span>Character size</span><select value={p.size} onChange={(e)=>onChange({size:e.target.value as MascotPreferences["size"]})}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
    <div className={styles.formDivider}>Position and movement</div>
    <label className={styles.field}><span>Default side</span><select value={p.defaultSide} onChange={(e)=>onChange({defaultSide:e.target.value as "left"|"right"})}><option value="left">Left</option><option value="right">Right</option></select></label>
    <Toggle title="Allow dragging" checked={p.dragEnabled} onChange={(dragEnabled)=>onChange({dragEnabled})} />
    <Toggle title="Remember position" checked={p.rememberPosition} onChange={(rememberPosition)=>onChange({rememberPosition})} />
    {onResetPosition ? <button type="button" className={styles.secondaryButton} onClick={onResetPosition}>Reset position</button> : null}
    <div className={styles.formDivider}>Features</div>
    <Toggle title="AI chat" checked={p.chatEnabled} onChange={(chatEnabled)=>onChange({chatEnabled})} />
    <Toggle title="Tic Tac Toe" checked={p.ticTacToeEnabled} onChange={(ticTacToeEnabled)=>onChange({ticTacToeEnabled})} />
    <Toggle title="Emotional tap reactions" checked={p.emotionalTapReactionsEnabled} onChange={(emotionalTapReactionsEnabled)=>onChange({emotionalTapReactionsEnabled})} />
    <Toggle title="Tap reaction speech" checked={p.tapReactionSpeechEnabled} onChange={(tapReactionSpeechEnabled)=>onChange({tapReactionSpeechEnabled})} />
    <label className={styles.field}><span>Reaction intensity</span><select value={p.emotionalIntensity} onChange={(e)=>onChange({emotionalIntensity:e.target.value as MascotPreferences["emotionalIntensity"]})}><option value="gentle">Gentle</option><option value="expressive">Expressive</option></select></label>
    <div className={styles.formDivider}>Motion</div>
    <label className={styles.field}><span>Animation</span><select value={p.reducedMotionOverride === null ? "system" : p.reducedMotionOverride ? "reduced" : "full"} onChange={(e)=>onChange({reducedMotionOverride:e.target.value === "system" ? null : e.target.value === "reduced"})}><option value="system">Follow operating system</option><option value="reduced">Reduced motion</option><option value="full">Full motion</option></select></label>
  </div>;
}
