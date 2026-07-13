export type TicTacToeCell = "X" | "O" | null;
export type TicTacToeBoard = readonly TicTacToeCell[];
export type TicTacToeResult = "playing" | "user-won" | "mascot-won" | "draw";
export type TicTacToeDifficulty = "friendly" | "smart";
