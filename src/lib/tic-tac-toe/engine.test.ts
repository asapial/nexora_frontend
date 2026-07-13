import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_BOARD, getGameResult, getMascotMove, getSmartMove, getWinner, placeMark } from "./engine.ts";

test("detects wins and draws without mutating the board", () => {
  const original = [...EMPTY_BOARD];
  const win = ["X","X","X",null,"O",null,"O",null,null] as const;
  const draw = ["X","O","X","X","O","O","O","X","X"] as const;
  assert.equal(getWinner(win),"X"); assert.equal(getGameResult(win),"user-won"); assert.equal(getGameResult(draw),"draw");
  placeMark(EMPTY_BOARD,4,"X"); assert.deepEqual(EMPTY_BOARD,original);
});
test("smart AI takes a win and blocks an immediate loss", () => {
  assert.equal(getSmartMove(["O","O",null,"X","X",null,null,null,null]),2);
  assert.equal(getSmartMove(["X","X",null,null,"O",null,null,null,null]),2);
});
test("friendly AI always returns a valid move", () => {
  const board = ["X",null,"O",null,null,null,null,null,null] as const;
  const move = getMascotMove(board,"friendly",()=>0);
  assert.ok(move !== null && board[move] === null);
});
