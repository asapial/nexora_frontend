"use client";

import { useEffect, useRef, useState } from "react";
import { ProctorBaseline, ProctorDecision } from "@/lib/examshield-kit/decision";
import { VisionDeviceDetection, VisionSignals } from "@/lib/examshield-kit/vision";
import { cn } from "@/lib/utils";

type MarkerDecision = Pick<ProctorDecision, "type" | "active">;

export function ProModeVideoMarkers({
  signals,
  baseline,
  decisions,
  compact = false,
  showCalibrationHint = true,
}: {
  signals: VisionSignals;
  baseline: ProctorBaseline | null;
  decisions: MarkerDecision[];
  compact?: boolean;
  showCalibrationHint?: boolean;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = overlayRef.current;
    if (!element) return;
    const update = () => setViewport({ width: element.clientWidth, height: element.clientHeight });
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const active = new Set(decisions.filter((decision) => decision.active).map((decision) => decision.type));
  const headDeltas = {
    yaw: baseline && signals.headYaw !== null ? signals.headYaw - baseline.headYaw : 0,
    pitch: baseline && signals.headPitch !== null ? signals.headPitch - baseline.headPitch : 0,
    roll: baseline && signals.headRoll !== null ? signals.headRoll - baseline.headRoll : 0,
  };
  const headAxis = (Object.entries(headDeltas) as Array<[keyof typeof headDeltas, number]>)
    .sort((first, second) => Math.abs(second[1]) - Math.abs(first[1]))[0]![0];
  const headDirection = directionLabel(headAxis, headDeltas[headAxis], 0.025);
  const eyeDeltas = {
    horizontal: baseline && signals.eyeHorizontal !== null ? signals.eyeHorizontal - baseline.eyeHorizontal : 0,
    vertical: baseline && signals.eyeVertical !== null ? signals.eyeVertical - baseline.eyeVertical : 0,
  };
  const eyeAxis = Math.abs(eyeDeltas.horizontal) >= Math.abs(eyeDeltas.vertical) ? "horizontal" : "vertical";
  const eyeDirection = directionLabel(eyeAxis, eyeDeltas[eyeAxis], 0.018);
  const detectedDevices = signals.detectedDevices.length
    ? signals.detectedDevices
    : signals.phoneBox ? [{
      category: "cell phone",
      label: "Phone",
      confidence: signals.phoneConfidence ?? 0,
      boxAspectRatio: signals.phoneBoxAspectRatio ?? 0,
      boxAreaRatio: signals.phoneBoxAreaRatio ?? 0,
      faceOverlap: signals.phoneFaceOverlap ?? 0,
      box: signals.phoneBox,
      model: signals.phoneModel ?? "Object detector",
    } satisfies VisionDeviceDetection] : [];
  const markerStyle = (box: NonNullable<VisionSignals["faceBox"]>) => {
    if (!viewport.width || !viewport.height || !signals.frameWidth || !signals.frameHeight) {
      return { left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` };
    }
    const frameAspect = signals.frameWidth / signals.frameHeight;
    const viewportAspect = viewport.width / viewport.height;
    const renderedWidth = frameAspect >= viewportAspect ? viewport.width : viewport.height * frameAspect;
    const renderedHeight = frameAspect >= viewportAspect ? viewport.width / frameAspect : viewport.height;
    const offsetX = (viewport.width - renderedWidth) / 2;
    const offsetY = (viewport.height - renderedHeight) / 2;
    return {
      left: offsetX + box.x * renderedWidth,
      top: offsetY + box.y * renderedHeight,
      width: box.width * renderedWidth,
      height: box.height * renderedHeight,
    };
  };

  return (
    <div ref={overlayRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={cn("absolute flex flex-wrap", compact ? "left-1.5 top-1.5 gap-1" : "left-3 top-3 gap-2")}>
        <MarkerBadge label={`HEAD ${headDirection}`} danger={active.has("HEAD_TURN_HORIZONTAL")} compact={compact} />
        <MarkerBadge label={`EYES ${eyeDirection}`} danger={active.has("EYE_MOVEMENT_HORIZONTAL")} compact={compact} />
        <MarkerBadge label={`${signals.faceCount} FACE${signals.faceCount === 1 ? "" : "S"}`} danger={signals.faceCount !== 1} compact={compact} />
        <MarkerBadge label={`${detectedDevices.length} DEVICE${detectedDevices.length === 1 ? "" : "S"}`} danger={detectedDevices.length > 0} compact={compact} />
      </div>

      {signals.faceBox && (
        <div
          className={cn(
            "absolute border-2",
            active.has("HEAD_TURN_HORIZONTAL") || active.has("EYE_MOVEMENT_HORIZONTAL")
              ? "border-amber-400 shadow-[0_0_18px_rgba(251,191,36,.65)]"
              : "border-teal-400 shadow-[0_0_18px_rgba(45,212,191,.45)]",
          )}
          style={markerStyle(signals.faceBox)}
        >
          <span className={cn(
            "absolute left-0 whitespace-nowrap rounded-t-md font-black text-zinc-950",
            compact ? "-top-4 px-1 py-0.5 text-[5px]" : "-top-6 px-2 py-1 text-[8px]",
            active.has("HEAD_TURN_HORIZONTAL") || active.has("EYE_MOVEMENT_HORIZONTAL") ? "bg-amber-400" : "bg-teal-400",
          )}>
            FACE | HEAD {headDirection} | EYES {eyeDirection}
          </span>
          <div className="absolute left-[18%] right-[18%] top-[42%] border-t border-dashed border-sky-300/90" />
          <div className="absolute left-1/2 top-[36%] h-[12%] -translate-x-1/2 border-l border-dashed border-white/70" />
        </div>
      )}

      {detectedDevices.map((device, index) => {
        const phone = device.category === "cell phone";
        return (
          <div
            key={`${device.category}-${index}`}
            className={cn(
              "absolute border-2",
              phone
                ? "border-rose-500 shadow-[0_0_22px_rgba(244,63,94,.75)]"
                : "border-amber-400 shadow-[0_0_22px_rgba(251,191,36,.65)]",
            )}
            style={markerStyle(device.box)}
          >
            <span className={cn(
              "absolute left-0 whitespace-nowrap rounded-t-md font-black text-white",
              phone ? "bg-rose-500" : "bg-amber-500",
              compact ? "-top-4 px-1 py-0.5 text-[5px]" : "-top-6 px-2 py-1 text-[8px]",
            )}>
              {device.label.toUpperCase()} | {percentage(device.confidence)}
            </span>
          </div>
        );
      })}

      {showCalibrationHint && !baseline && (
        <div className={cn("absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-violet-300/40 bg-violet-950/80 font-black text-violet-100 backdrop-blur", compact ? "px-2 py-1 text-[6px]" : "px-4 py-2 text-[9px]")}>
          Calibrate to enable direction markers
        </div>
      )}
    </div>
  );
}

function MarkerBadge({ label, danger, compact }: { label: string; danger: boolean; compact: boolean }) {
  return (
    <span className={cn(
      "rounded-full border font-black text-white backdrop-blur",
      compact ? "px-1.5 py-0.5 text-[5px]" : "px-2.5 py-1 text-[8px]",
      danger ? "border-rose-400/60 bg-rose-600/85" : "border-white/20 bg-zinc-950/70",
    )}>
      {label}
    </span>
  );
}

const percentage = (value: number | null) => value === null ? "Not detected" : `${Math.round(value * 100)}%`;

const directionLabel = (
  axis: "yaw" | "pitch" | "roll" | "horizontal" | "vertical",
  delta: number,
  threshold: number,
) => {
  if (Math.abs(delta) < threshold) return "CENTER";
  if (axis === "pitch" || axis === "vertical") return delta > 0 ? "DOWN" : "UP";
  return delta > 0 ? "RIGHT" : "LEFT";
};
