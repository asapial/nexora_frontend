import { expect, test } from "vitest";
import { clampMascotPosition, clampPixels, pixelsToPosition, positionToPixels } from "./position.ts";

const box = { width: 1000, height: 800, mascotWidth: 100, mascotHeight: 120, top: 12, bottom: 70, inset: 12 };
test("stored ratios are validated and converted inside the safe viewport", () => {
  expect(clampMascotPosition({ side:"right", verticalRatio:3 })).toEqual({ side:"right", verticalRatio:1 });
  expect(positionToPixels({ side:"right", verticalRatio:1 }, box)).toEqual({ x:888, y:610 });
});
test("pixels clamp and snap to the nearest edge", () => {
  expect(clampPixels(-20,900,box)).toEqual({ x:12, y:610 });
  expect(pixelsToPosition(800,200,box).side).toBe("right");
  expect(pixelsToPosition(30,200,box).side).toBe("left");
});
