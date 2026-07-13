import type { TicTacToeBoard, TicTacToeCell, TicTacToeDifficulty, TicTacToeResult } from "../../types/tic-tac-toe.ts";

export const EMPTY_BOARD: TicTacToeBoard = Object.freeze(Array<TicTacToeCell>(9).fill(null));
export const WINNING_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]] as const;

export function getWinner(board: TicTacToeBoard): Exclude<TicTacToeCell, null> | null {
  for (const [a,b,c] of WINNING_LINES) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return null;
}
export function getGameResult(board: TicTacToeBoard, userMark: Exclude<TicTacToeCell, null> = "X"): TicTacToeResult {
  const winner = getWinner(board);
  if (winner) return winner === userMark ? "user-won" : "mascot-won";
  return board.every(Boolean) ? "draw" : "playing";
}
export function placeMark(board: TicTacToeBoard, index: number, mark: Exclude<TicTacToeCell, null>): TicTacToeBoard {
  if (!Number.isInteger(index) || index < 0 || index > 8 || board[index]) return board;
  const next = [...board]; next[index] = mark; return next;
}
export const availableMoves = (board: TicTacToeBoard): number[] => board.flatMap((cell, index) => cell === null ? [index] : []);

function minimax(board: TicTacToeBoard, maximizing: boolean, mascotMark: "X" | "O", userMark: "X" | "O", depth: number): number {
  const winner = getWinner(board);
  if (winner === mascotMark) return 10 - depth;
  if (winner === userMark) return depth - 10;
  const moves = availableMoves(board);
  if (!moves.length) return 0;
  const scores = moves.map((move) => minimax(placeMark(board, move, maximizing ? mascotMark : userMark), !maximizing, mascotMark, userMark, depth + 1));
  return maximizing ? Math.max(...scores) : Math.min(...scores);
}

export function getSmartMove(board: TicTacToeBoard, mascotMark: "X" | "O" = "O"): number | null {
  const moves = availableMoves(board); if (!moves.length) return null;
  const userMark = mascotMark === "O" ? "X" : "O";
  let best = -Infinity; let bestMove = moves[0];
  for (const move of moves) { const score = minimax(placeMark(board, move, mascotMark), false, mascotMark, userMark, 0); if (score > best) { best = score; bestMove = move; } }
  return bestMove;
}

export function getMascotMove(board: TicTacToeBoard, difficulty: TicTacToeDifficulty, random = Math.random): number | null {
  const moves = availableMoves(board); if (!moves.length) return null;
  if (difficulty === "friendly" && random() < 0.36) return moves[Math.floor(random() * moves.length)] ?? moves[0];
  return getSmartMove(board);
}
