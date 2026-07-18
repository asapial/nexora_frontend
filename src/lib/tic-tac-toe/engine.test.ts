import { expect, test } from "vitest";
import { EMPTY_BOARD, getGameResult, getMascotMove, getSmartMove, getWinner, placeMark } from "./engine.ts";

test("detects wins and draws without mutating the board", () => {
  const original = [...EMPTY_BOARD];
  const win = ["X","X","X",null,"O",null,"O",null,null] as const;
  const draw = ["X","O","X","X","O","O","O","X","X"] as const;
  expect(getWinner(win)).toBe("X");
  expect(getGameResult(win)).toBe("user-won");
  expect(getGameResult(draw)).toBe("draw");
  placeMark(EMPTY_BOARD,4,"X");
  expect(EMPTY_BOARD).toEqual(original);
});
test("smart AI takes a win and blocks an immediate loss", () => {
  expect(getSmartMove(["O","O",null,"X","X",null,null,null,null])).toBe(2);
  expect(getSmartMove(["X","X",null,null,"O",null,null,null,null])).toBe(2);
});
test("friendly AI always returns a valid move", () => {
  const board = ["X",null,"O",null,null,null,null,null,null] as const;
  const move = getMascotMove(board,"friendly",()=>0);
  expect(move).not.toBeNull();
  expect(board[move!]).toBeNull();
});
