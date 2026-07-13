"use client";

import { Gamepad2, Grip, MessageCircle, Settings2, X, EyeOff } from "lucide-react";
import type { MascotPanel, MascotPreferences } from "@/types/mascot";
import styles from "./mascot.module.css";

export function MascotActionMenu({ preferences, onSelect, onMove, onHide, onClose }: { preferences:MascotPreferences; onSelect:(panel:MascotPanel)=>void; onMove:()=>void; onHide:()=>void; onClose:()=>void }) {
  return <div className={styles.actionMenu} style={{zIndex:3}} role="menu" aria-label="Nimbi actions">
    <div className={styles.actionHeader}><strong>What should we do?</strong><button type="button" aria-label="Close Nimbi actions" onClick={onClose}><X /></button></div>
    {preferences.chatEnabled ? <button role="menuitem" type="button" onClick={()=>onSelect("chat")}><MessageCircle />Chat with Nimbi</button> : null}
    {preferences.ticTacToeEnabled ? <button role="menuitem" type="button" onClick={()=>onSelect("tic-tac-toe")}><Gamepad2 />Play Tic Tac Toe</button> : null}
    {preferences.dragEnabled ? <button role="menuitem" type="button" onClick={onMove}><Grip />Move Nimbi</button> : null}
    <button role="menuitem" type="button" onClick={()=>onSelect("quick-settings")}><Settings2 />Quick settings</button>
    <button role="menuitem" type="button" onClick={onHide}><EyeOff />Hide Nimbi</button>
  </div>;
}
