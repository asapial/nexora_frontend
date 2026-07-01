import { ProctorBaseline, ProctorDecision } from "@/lib/examshield-kit/decision";
import { VisionSignals } from "@/lib/examshield-kit/vision";
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
  const active = new Set(decisions.filter((decision) => decision.active).map((decision) => decision.type));
  const headDelta = baseline && signals.headYaw !== null ? signals.headYaw - baseline.headYaw : 0;
  const eyeDelta = baseline && signals.eyeHorizontal !== null ? signals.eyeHorizontal - baseline.eyeHorizontal : 0;
  const eyeDirection = eyeDelta > 0.02 ? "RIGHT" : eyeDelta < -0.02 ? "LEFT" : "CENTER";
  const headDirection = headDelta > 0.03 ? "RIGHT" : headDelta < -0.03 ? "LEFT" : "CENTER";
  const markerStyle = (box: NonNullable<VisionSignals["faceBox"]>) => ({
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={cn("absolute flex flex-wrap", compact ? "left-1.5 top-1.5 gap-1" : "left-3 top-3 gap-2")}>
        <MarkerBadge label={`HEAD ${headDirection}`} danger={active.has("HEAD_TURN_HORIZONTAL")} compact={compact} />
        <MarkerBadge label={`EYES ${eyeDirection}`} danger={active.has("EYE_MOVEMENT_HORIZONTAL")} compact={compact} />
        <MarkerBadge label={`${signals.faceCount} FACE${signals.faceCount === 1 ? "" : "S"}`} danger={signals.faceCount !== 1} compact={compact} />
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

      {signals.phoneBox && (
        <div className="absolute border-2 border-rose-500 shadow-[0_0_22px_rgba(244,63,94,.75)]" style={markerStyle(signals.phoneBox)}>
          <span className={cn("absolute left-0 whitespace-nowrap rounded-t-md bg-rose-500 font-black text-white", compact ? "-top-4 px-1 py-0.5 text-[5px]" : "-top-6 px-2 py-1 text-[8px]")}>
            PHONE | {percentage(signals.phoneConfidence)} | {signals.phoneModel ?? "MODEL"}
          </span>
        </div>
      )}

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
