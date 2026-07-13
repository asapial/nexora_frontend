import assert from "node:assert/strict";
import test from "node:test";
import { clampMascotPosition, clampPixels, pixelsToPosition, positionToPixels } from "./position.ts";

const box = { width: 1000, height: 800, mascotWidth: 100, mascotHeight: 120, top: 12, bottom: 70, inset: 12 };
test("stored ratios are validated and converted inside the safe viewport", () => {
  assert.deepEqual(clampMascotPosition({ side:"right", verticalRatio:3 }), { side:"right", verticalRatio:1 });
  assert.deepEqual(positionToPixels({ side:"right", verticalRatio:1 }, box), { x:888, y:610 });
});
test("pixels clamp and snap to the nearest edge", () => {
  assert.deepEqual(clampPixels(-20,900,box), { x:12, y:610 });
  assert.equal(pixelsToPosition(800,200,box).side,"right");
  assert.equal(pixelsToPosition(30,200,box).side,"left");
});
