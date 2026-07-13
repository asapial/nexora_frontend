"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import type { MascotPosition } from "@/types/mascot";
import { clampPixels, pixelsToPosition, positionToPixels, type ViewportBox } from "@/lib/mascot/position";
import { emitMascotEvent } from "@/lib/mascot/eventBus";

interface Options { position: MascotPosition; enabled: boolean; remember: boolean; onSave: (position: MascotPosition) => void }
interface Point { x: number; y: number }

export function useMascotDrag({ position, enabled, remember, onSave }: Options) {
  const elementRef = useRef<HTMLElement>(null);
  const [point, setPoint] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [repositioning, setRepositioning] = useState(false);
  const dragRef = useRef<{ pointerId:number; origin:Point; pointer:Point; current:Point; dragging:boolean } | null>(null);
  const rafRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const savedPointRef = useRef<Point | null>(null);

  const box = useCallback((): ViewportBox => {
    const rect = elementRef.current?.getBoundingClientRect();
    return { width: window.innerWidth, height: window.innerHeight, mascotWidth: rect?.width ?? 96, mascotHeight: rect?.height ?? 124, top: 12, bottom: window.innerWidth <= 640 ? 76 : 16, inset: 12 };
  }, []);
  const syncFromPreference = useCallback(() => { if (typeof window !== "undefined") setPoint(positionToPixels(position, box())); }, [box, position]);
  useEffect(() => { syncFromPreference(); const resize = () => syncFromPreference(); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize); }, [syncFromPreference]);
  useEffect(() => () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); }, []);

  const schedulePoint = useCallback((next: Point) => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; setPoint(clampPixels(next.x, next.y, box())); });
  }, [box]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || event.button !== 0 || !point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId:event.pointerId, origin:point, pointer:{x:event.clientX,y:event.clientY}, current:point, dragging:false };
  }, [enabled, point]);
  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.pointer.x; const dy = event.clientY - drag.pointer.y;
    if (!drag.dragging && Math.hypot(dx, dy) < 6) return;
    if (!drag.dragging) { drag.dragging = true; setIsDragging(true); emitMascotEvent("mascot_drag_started"); }
    drag.current = clampPixels(drag.origin.x + dx, drag.origin.y + dy, box()); schedulePoint(drag.current);
  }, [box, schedulePoint]);
  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    if (!drag.dragging) return;
    suppressClickRef.current = true; setIsDragging(false);
    const next = pixelsToPosition(drag.current.x, drag.current.y, box());
    const snapped = positionToPixels(next, box()); setPoint(snapped);
    if (remember) onSave(next);
    emitMascotEvent("mascot_drag_ended", { side:next.side });
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  }, [box, onSave, remember]);

  const beginKeyboardReposition = useCallback(() => { savedPointRef.current = point; setRepositioning(true); elementRef.current?.focus(); }, [point]);
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (!repositioning || !point) return;
    const delta: Record<string, Point> = { ArrowLeft:{x:-12,y:0}, ArrowRight:{x:12,y:0}, ArrowUp:{x:0,y:-12}, ArrowDown:{x:0,y:12} };
    if (delta[event.key]) {
      event.preventDefault();
      const movement = delta[event.key];
      setPoint((current) => current
        ? clampPixels(current.x + movement.x, current.y + movement.y, box())
        : current);
    }
    else if (event.key === "Escape") { event.preventDefault(); setPoint(savedPointRef.current); setRepositioning(false); }
    else if (event.key === "Enter") { event.preventDefault(); const next = pixelsToPosition(point.x, point.y, box()); setPoint(positionToPixels(next, box())); onSave(next); setRepositioning(false); emitMascotEvent("mascot_drag_ended", { side:next.side }); }
  }, [box, onSave, point, repositioning]);
  const style: CSSProperties | undefined = point ? { left:point.x, top:point.y } : undefined;
  return { elementRef: elementRef as RefObject<HTMLElement>, style, isDragging, repositioning, beginKeyboardReposition, onPointerDown, onPointerMove, onPointerUp, onPointerCancel:onPointerUp, onKeyDown, wasDrag:() => suppressClickRef.current };
}
