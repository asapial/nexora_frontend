"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { TicTacToeBoard, TicTacToeDifficulty, TicTacToeResult } from "@/types/tic-tac-toe";
import { EMPTY_BOARD, getGameResult, getMascotMove, placeMark } from "@/lib/tic-tac-toe/engine";
import { emitMascotEvent } from "@/lib/mascot/eventBus";
import styles from "./mascot.module.css";

export default function MascotGamePanel({ onClose }: { onClose:()=>void }) {
  const [board,setBoard]=useState<TicTacToeBoard>(EMPTY_BOARD); const [difficulty,setDifficulty]=useState<TicTacToeDifficulty>("friendly");
  const [result,setResult]=useState<TicTacToeResult>("playing"); const [mascotThinking,setMascotThinking]=useState(false);
  const [score,setScore]=useState({user:0,mascot:0,draw:0}); const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const newGame=useCallback(()=>{if(timer.current)clearTimeout(timer.current);setBoard(EMPTY_BOARD);setResult("playing");setMascotThinking(false);emitMascotEvent("game_started");},[]);
  useEffect(()=>{emitMascotEvent("game_started");return()=>{if(timer.current)clearTimeout(timer.current)}},[]);
  const finish=useCallback((next:TicTacToeBoard)=>{const nextResult=getGameResult(next);setResult(nextResult);if(nextResult!=="playing"){setScore((s)=>({...s,[nextResult==="user-won"?"user":nextResult==="mascot-won"?"mascot":"draw"]:s[nextResult==="user-won"?"user":nextResult==="mascot-won"?"mascot":"draw"]+1}));emitMascotEvent("game_finished",{result:nextResult});}return nextResult;},[]);
  const play=(index:number)=>{if(result!=="playing"||mascotThinking||board[index])return;const userBoard=placeMark(board,index,"X");setBoard(userBoard);emitMascotEvent("game_move_completed",{player:"user"});if(finish(userBoard)!=="playing")return;setMascotThinking(true);timer.current=setTimeout(()=>{const move=getMascotMove(userBoard,difficulty);const mascotBoard=move===null?userBoard:placeMark(userBoard,move,"O");setBoard(mascotBoard);setMascotThinking(false);emitMascotEvent("game_move_completed",{player:"mascot"});finish(mascotBoard);},420);};
  const status=result==="user-won"?"You win! Brilliant move.":result==="mascot-won"?"Nimbi wins. Good game!":result==="draw"?"A draw. Evenly matched!":mascotThinking?"Nimbi is thinking…":"Your turn";
  return <section className={styles.gamePanel} role="dialog" aria-modal="true" aria-label="Play Tic Tac Toe with Nimbi">
    <header><div><strong>Tic Tac Toe</strong><small>You are X · Nimbi is O</small></div><button type="button" aria-label="Close game" onClick={onClose}><X /></button></header>
    <div className={styles.gameControls}><label>Difficulty <select value={difficulty} onChange={(e)=>{setDifficulty(e.target.value as TicTacToeDifficulty);newGame();}}><option value="friendly">Friendly</option><option value="smart">Smart</option></select></label><span>Wins {score.user} · Nimbi {score.mascot} · Draws {score.draw}</span></div>
    <div className={styles.gameStatus} aria-live="polite">{status}</div>
    <div className={styles.gameBoard} role="grid" aria-label="Tic Tac Toe board">{board.map((cell,index)=><button key={index} type="button" role="gridcell" aria-label={`Row ${Math.floor(index/3)+1}, column ${(index%3)+1}, ${cell??"empty"}`} disabled={!!cell||result!=="playing"||mascotThinking} onClick={()=>play(index)}>{cell}</button>)}</div>
    <button type="button" className={styles.primaryButton} onClick={newGame}>New game</button>
  </section>;
}
