import type { MascotPosition } from "../../types/mascot.ts";

export interface ViewportBox { width: number; height: number; mascotWidth: number; mascotHeight: number; top?: number; bottom?: number; inset?: number }

export function clampMascotPosition(position: MascotPosition): MascotPosition {
  return { side: position.side === "left" ? "left" : "right", verticalRatio: Number.isFinite(position.verticalRatio) ? Math.min(1, Math.max(0, position.verticalRatio)) : 0.82 };
}

export function positionToPixels(position: MascotPosition, box: ViewportBox): { x: number; y: number } {
  const safe = clampMascotPosition(position);
  const inset = box.inset ?? 16;
  const top = box.top ?? inset;
  const bottom = box.bottom ?? inset;
  const available = Math.max(0, box.height - top - bottom - box.mascotHeight);
  return {
    x: safe.side === "left" ? inset : Math.max(inset, box.width - box.mascotWidth - inset),
    y: top + available * safe.verticalRatio,
  };
}

export function pixelsToPosition(x: number, y: number, box: ViewportBox): MascotPosition {
  const inset = box.inset ?? 16;
  const top = box.top ?? inset;
  const bottom = box.bottom ?? inset;
  const available = Math.max(1, box.height - top - bottom - box.mascotHeight);
  return clampMascotPosition({ side: x + box.mascotWidth / 2 < box.width / 2 ? "left" : "right", verticalRatio: (y - top) / available });
}

export function clampPixels(x: number, y: number, box: ViewportBox): { x: number; y: number } {
  const inset = box.inset ?? 16;
  const top = box.top ?? inset;
  const bottom = box.bottom ?? inset;
  return { x: Math.min(box.width - box.mascotWidth - inset, Math.max(inset, x)), y: Math.min(box.height - box.mascotHeight - bottom, Math.max(top, y)) };
}
