"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiAlertLine, RiCameraLine, RiCheckboxCircleLine, RiEyeLine,
  RiFocus3Line, RiLoader4Line, RiPhoneLine, RiRefreshLine, RiShieldCheckLine, RiStopCircleLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { ExamShieldHeader, MetricCard } from "@/components/examshield/ExamShieldUI";
import { ProModeVideoMarkers } from "@/components/examshield/ProModeVideoMarkers";
import { ProctorSensitivity } from "@/lib/examShield";
import {
  evaluateProctorSignals, getProctorDecisionConfig, ProctorBaseline, ProctorDecision, ProctorSignalType,
} from "@/lib/examshield-kit/decision";
import { startVideoFrameLoop } from "@/lib/examshield-kit/frame-loop";
import { ExamShieldVision, VisionSignals } from "@/lib/examshield-kit/vision";
import { cn } from "@/lib/utils";

type LabState = "IDLE" | "STARTING" | "RUNNING" | "ERROR";
type DecisionRow = ProctorDecision & { sustainedMs: number; triggered: boolean };
type LabEvent = DecisionRow & { id: string; occurredAt: number };

const emptySignals: VisionSignals = {
  faceCount: 0,
  headYaw: null,
  eyeHorizontal: null,
  leftEyeHorizontal: null,
  rightEyeHorizontal: null,
  eyeAgreement: null,
  phoneConfidence: null,
  phoneBoxAspectRatio: null,
  phoneBoxAreaRatio: null,
  phoneFaceOverlap: null,
  faceBox: null,
  phoneBox: null,
  phoneModel: null,
};
const signalLabels: Record<ProctorSignalType, string> = {
  FACE_NOT_VISIBLE: "Face not visible",
  MULTIPLE_FACES: "Multiple faces",
  HEAD_TURN_HORIZONTAL: "Horizontal head turn",
  EYE_MOVEMENT_HORIZONTAL: "Horizontal eye movement",
  PHONE_DETECTED: "Visible phone",
};

const percentage = (value: number | null) => value === null ? "Not detected" : `${Math.round(value * 100)}%`;
const decimal = (value: number | null) => value === null ? "Waiting" : value.toFixed(3);

export default function ExamShieldLabPage() {
  const [labState, setLabState] = useState<LabState>("IDLE");
  const [sensitivity, setSensitivity] = useState<ProctorSensitivity>("STANDARD");
  const [signals, setSignals] = useState<VisionSignals>(emptySignals);
  const [baseline, setBaseline] = useState<ProctorBaseline | null>(null);
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [phoneReady, setPhoneReady] = useState(false);
  const [phoneModel, setPhoneModel] = useState<string | null>(null);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const visionRef = useRef<ExamShieldVision | null>(null);
  const signalsRef = useRef<VisionSignals>(emptySignals);
  const startsRef = useRef<Partial<Record<ProctorSignalType, number>>>({});
  const positivesRef = useRef<Partial<Record<ProctorSignalType, number>>>({});
  const emittedRef = useRef<Partial<Record<ProctorSignalType, number>>>({});

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    visionRef.current?.close();
    visionRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLabState("IDLE");
    setPhoneReady(false);
    setPhoneModel(null);
    setDecisions([]);
    startsRef.current = {};
    positivesRef.current = {};
    emittedRef.current = {};
  }, []);

  const start = async () => {
    stop();
    setError("");
    setLabState("STARTING");
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error("Camera testing requires a secure browser context");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 }, frameRate: { ideal: 20, max: 30 } },
        audio: false,
      });
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("Camera preview is unavailable");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const vision = new ExamShieldVision();
      const support = await vision.initialize();
      visionRef.current = vision;
      setPhoneReady(support.phoneDetectionSupported);
      setPhoneModel(support.phoneModel);
      setLabState("RUNNING");
      toast.success("Pro Mode diagnostics started");
    } catch (reason) {
      stop();
      setLabState("ERROR");
      setError(reason instanceof Error ? reason.message : "Could not start diagnostics");
      toast.error("Could not start the Pro Mode diagnostics camera");
    }
  };

  const calibrate = () => {
    const current = signalsRef.current;
    if (current.faceCount !== 1 || current.headYaw === null || current.eyeHorizontal === null || current.leftEyeHorizontal === null || current.rightEyeHorizontal === null) {
      toast.error("Keep exactly one face visible and look naturally at the screen");
      return;
    }
    setBaseline({
      headYaw: current.headYaw,
      eyeHorizontal: current.eyeHorizontal,
      leftEyeHorizontal: current.leftEyeHorizontal,
      rightEyeHorizontal: current.rightEyeHorizontal,
    });
    startsRef.current = {};
    positivesRef.current = {};
    emittedRef.current = {};
    setEvents([]);
    toast.success("Neutral head and eye position calibrated");
  };

  const resetTimeline = () => {
    startsRef.current = {};
    positivesRef.current = {};
    emittedRef.current = {};
    setEvents([]);
    toast.success("Test decisions cleared");
  };

  useEffect(() => {
    if (labState !== "RUNNING") return;
    const video = videoRef.current;
    if (!video) return;
    return startVideoFrameLoop(video, () => {
      const vision = visionRef.current;
      if (!vision || video.readyState < 2) return;
      try {
        const now = Date.now();
        const nextSignals = vision.analyze(video, performance.now());
        const config = getProctorDecisionConfig(sensitivity);
        signalsRef.current = nextSignals;
        setSignals(nextSignals);
        const nextDecisions = evaluateProctorSignals(nextSignals, baseline, sensitivity).map((decision) => {
          if (decision.active) {
            positivesRef.current[decision.type] = now;
            startsRef.current[decision.type] ??= now;
          } else if (now - (positivesRef.current[decision.type] ?? 0) > config.signalGrace) {
            delete startsRef.current[decision.type];
          }
          const sustainedMs = startsRef.current[decision.type] ? now - startsRef.current[decision.type]! : 0;
          const triggered = decision.active && sustainedMs >= decision.thresholdMs;
          if (triggered && now - (emittedRef.current[decision.type] ?? 0) >= config.cooldown) {
            emittedRef.current[decision.type] = now;
            setEvents((current) => [{ ...decision, sustainedMs, triggered, id: crypto.randomUUID(), occurredAt: now }, ...current].slice(0, 30));
          }
          return { ...decision, sustainedMs, triggered };
        });
        setDecisions(nextDecisions);
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Vision analysis failed";
        stop();
        setError(message);
        setLabState("ERROR");
      }
    }, 30);
  }, [baseline, labState, sensitivity, stop]);

  useEffect(() => () => stop(), [stop]);

  const config = getProctorDecisionConfig(sensitivity);
  const activeCount = decisions.filter((decision) => decision.active).length;
  const triggeredCount = events.length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 lg:p-8">
      <ExamShieldHeader
        eyebrow="Admin · ExamShield diagnostics"
        title="Pro Mode detection lab"
        description="Test the same local camera model and decision boundaries used by a Pro Mode exam. This isolated lab never records violations, creates notifications, or affects a student."
      />

      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
        <RiAlertLine className="mr-2 inline text-base" />
        Treat detections as review signals, not proof of misconduct. Phone detection only works when the phone is visible inside the camera frame.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Detector status" value={labState === "RUNNING" ? "30 FPS" : labState.toLowerCase()} note={phoneReady ? `Frame-driven vision + ${phoneModel ?? "phone model"} ready` : "Start camera to initialize"} icon={<RiCameraLine />} />
        <MetricCard label="Faces visible" value={signals.faceCount} note="Exactly one face is expected" icon={<RiFocus3Line />} accent={signals.faceCount === 1 ? "teal" : "rose"} />
        <MetricCard label="Active candidates" value={activeCount} note="Signals currently above boundary" icon={<RiEyeLine />} accent={activeCount ? "rose" : "sky"} />
        <MetricCard label="Demo decisions" value={triggeredCount} note="Local events during this test" icon={<RiShieldCheckLine />} accent={triggeredCount ? "rose" : "violet"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div><h2 className="text-[14px] font-black">Camera and demo exam</h2><p className="mt-1 text-[10px] text-muted-foreground">Use a phone, turn horizontally, or move only your eyes while watching the live decision panel.</p></div>
            <div className="flex flex-wrap gap-2">
              <select value={sensitivity} onChange={(event) => setSensitivity(event.target.value as ProctorSensitivity)} className="h-10 rounded-xl border border-border bg-muted/30 px-3 text-[11px] font-bold outline-none">
                <option value="RELAXED">Relaxed sensitivity</option>
                <option value="STANDARD">Standard sensitivity</option>
                <option value="STRICT">Strict sensitivity</option>
              </select>
              {labState === "RUNNING" ? <button onClick={stop} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-500/25 px-4 text-[11px] font-bold text-rose-600"><RiStopCircleLine /> Stop test</button> : <button onClick={start} disabled={labState === "STARTING"} className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-4 text-[11px] font-bold text-white disabled:opacity-50">{labState === "STARTING" ? <RiLoader4Line className="animate-spin" /> : <RiCameraLine />} Start camera test</button>}
            </div>
          </div>
          <div className="relative aspect-[4/3] bg-zinc-950">
            <video ref={videoRef} muted playsInline className="h-full w-full object-contain" />
            {labState === "RUNNING" && <ProModeVideoMarkers signals={signals} baseline={baseline} decisions={decisions} />}
            {labState !== "RUNNING" && <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 text-center text-zinc-300"><div><RiCameraLine className="mx-auto text-4xl" /><p className="mt-3 text-[12px] font-black">{labState === "STARTING" ? "Loading detection models..." : "Camera diagnostics are stopped"}</p><p className="mt-1 text-[10px] text-zinc-400">{error || "Start the test when you are ready."}</p></div></div>}
          </div>
          <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-[1fr_220px]">
            <div className="rounded-xl border border-border bg-muted/15 p-4">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">Demo exam · Question 1</p><h3 className="mt-2 text-[13px] font-black">Which behavior should Pro Mode send for teacher review?</h3></div><span className="rounded-full bg-teal-500/10 px-2 py-1 text-[9px] font-bold text-teal-600">1 mark</span></div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">{["Normal vertical rough-work glance", "Sustained horizontal head turn", "Reading the current question", "Keeping one face visible"].map((option, index) => <label key={option} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-[10px] font-bold"><input type="radio" name="lab-question" defaultChecked={index === 1} />{option}</label>)}</div>
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-violet-600">Neutral calibration</p>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{baseline ? "Baseline captured. Decisions compare movement against this position." : "Look naturally at the screen, then capture your neutral position."}</p>
              <button onClick={calibrate} disabled={labState !== "RUNNING" || signals.faceCount !== 1} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-[10px] font-bold text-white disabled:opacity-40"><RiFocus3Line /> {baseline ? "Recalibrate" : "Calibrate now"}</button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-[14px] font-black">Algorithm decision panel</h2><p className="mt-1 text-[10px] text-muted-foreground">Live boundaries from real Pro Mode logic.</p></div><span className={cn("h-2.5 w-2.5 rounded-full", labState === "RUNNING" ? "animate-pulse bg-teal-500" : "bg-muted-foreground/30")} /></div>
          <div className="mt-4 space-y-3">
            {decisions.length ? decisions.map((decision) => <DecisionCard key={decision.type} decision={decision} />) : Object.entries(signalLabels).map(([type, label]) => <div key={type} className="rounded-xl border border-border bg-muted/10 p-3"><p className="text-[10px] font-bold text-muted-foreground">{label}</p><div className="mt-2 h-1.5 rounded-full bg-muted" /></div>)}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-[14px] font-black">Raw model measurements</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">Useful when tuning sensitivity for different cameras and lighting.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <RawValue label="Head yaw" value={decimal(signals.headYaw)} note={`Boundary ±${config.headDelta}`} />
            <RawValue label="Left eye position" value={decimal(signals.leftEyeHorizontal)} note={`Movement boundary ±${config.eyeDelta}`} />
            <RawValue label="Right eye position" value={decimal(signals.rightEyeHorizontal)} note={`Movement boundary ±${config.eyeDelta}`} />
            <RawValue label="Eye agreement" value={decimal(signals.eyeAgreement)} note={`Must be ≤ ${config.maxEyeDisagreement}`} />
            <RawValue label="Phone confidence" value={percentage(signals.phoneConfidence)} note={`Decision boundary ${Math.round(config.phoneConfidence * 100)}%`} />
            <RawValue label="Phone model" value={signals.phoneModel ?? phoneModel ?? "Waiting"} note="EfficientDet + SSD model-diverse ensemble" />
            <RawValue label="Phone box shape" value={decimal(signals.phoneBoxAspectRatio)} note="Square-like boxes are rejected" />
            <RawValue label="Phone frame area" value={percentage(signals.phoneBoxAreaRatio)} note="Rejects implausible object sizes" />
            <RawValue label="Phone / face overlap" value={percentage(signals.phoneFaceOverlap)} note="Over 28% is rejected as likely headwear" />
            <RawValue label="Face count" value={String(signals.faceCount)} note="Expected: exactly 1" />
            <RawValue label="Baseline yaw" value={decimal(baseline?.headYaw ?? null)} note="Neutral reference" />
            <RawValue label="Baseline left eye" value={decimal(baseline?.leftEyeHorizontal ?? null)} note="Neutral reference" />
            <RawValue label="Baseline right eye" value={decimal(baseline?.rightEyeHorizontal ?? null)} note="Neutral reference" />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-[14px] font-black">Local decision timeline</h2><p className="mt-1 text-[10px] text-muted-foreground">These demo decisions are not saved or sent anywhere.</p></div><button onClick={resetTimeline} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-[10px] font-bold"><RiRefreshLine /> Clear</button></div>
          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
            {events.length === 0 ? <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-[11px] text-muted-foreground">No decision has crossed its sustained threshold yet.</div> : events.map((event) => <div key={event.id} className={cn("flex items-center gap-3 rounded-xl border p-3", event.type === "PHONE_DETECTED" ? "border-rose-500/30 bg-rose-500/10" : "border-amber-500/25 bg-amber-500/5")}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card text-rose-600">{event.type === "PHONE_DETECTED" ? <RiPhoneLine /> : <RiAlertLine />}</span><div className="min-w-0 flex-1"><p className="text-[11px] font-black">{event.label}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{new Date(event.occurredAt).toLocaleTimeString()} · {(event.sustainedMs / 1000).toFixed(1)}s sustained · {Math.round(event.confidence * 100)}% confidence</p></div><RiCheckboxCircleLine className="text-teal-600" /></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}

function DecisionCard({ decision }: { decision: DecisionRow }) {
  const progress = Math.min(100, Math.round((decision.sustainedMs / decision.thresholdMs) * 100));
  return <div className={cn("rounded-xl border p-3 transition", decision.triggered ? "border-rose-500/35 bg-rose-500/10" : decision.active ? "border-amber-500/30 bg-amber-500/8" : "border-border bg-muted/10")}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black">{decision.label}</p><span className={cn("rounded-full px-2 py-1 text-[8px] font-extrabold uppercase", decision.triggered ? "bg-rose-500 text-white" : decision.active ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground")}>{decision.triggered ? "Decision" : decision.active ? "Candidate" : "Clear"}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full transition-all", decision.triggered ? "bg-rose-500" : "bg-amber-500")} style={{ width: `${progress}%` }} /></div><p className="mt-2 text-[9px] text-muted-foreground">{(decision.sustainedMs / 1000).toFixed(1)}s / {(decision.thresholdMs / 1000).toFixed(1)}s required · {Math.round(decision.confidence * 100)}% confidence</p></div>;
}

function RawValue({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-xl border border-border bg-muted/10 p-3"><p className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-lg font-black tabular-nums">{value}</p><p className="mt-1 text-[8px] text-muted-foreground">{note}</p></div>;
}

// Kept temporarily for backward-compatible lab snapshots.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function VideoMarkers({ signals, baseline, decisions }: { signals: VisionSignals; baseline: ProctorBaseline | null; decisions: DecisionRow[] }) {
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

  return <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
      <MarkerBadge label={`HEAD ${headDirection}`} danger={active.has("HEAD_TURN_HORIZONTAL")} />
      <MarkerBadge label={`EYES ${eyeDirection}`} danger={active.has("EYE_MOVEMENT_HORIZONTAL")} />
      <MarkerBadge label={`${signals.faceCount} FACE${signals.faceCount === 1 ? "" : "S"}`} danger={signals.faceCount !== 1} />
    </div>
    {signals.faceBox && <div className={cn("absolute border-2", active.has("HEAD_TURN_HORIZONTAL") || active.has("EYE_MOVEMENT_HORIZONTAL") ? "border-amber-400 shadow-[0_0_18px_rgba(251,191,36,.65)]" : "border-teal-400 shadow-[0_0_18px_rgba(45,212,191,.45)]")} style={markerStyle(signals.faceBox)}>
      <span className={cn("absolute -top-6 left-0 rounded-t-md px-2 py-1 text-[8px] font-black text-zinc-950", active.has("HEAD_TURN_HORIZONTAL") || active.has("EYE_MOVEMENT_HORIZONTAL") ? "bg-amber-400" : "bg-teal-400")}>FACE · HEAD {headDirection} · EYES {eyeDirection}</span>
      <div className="absolute left-[18%] right-[18%] top-[42%] border-t border-dashed border-sky-300/90" />
      <div className="absolute left-1/2 top-[36%] h-[12%] -translate-x-1/2 border-l border-dashed border-white/70" />
    </div>}
    {signals.phoneBox && <div className="absolute border-2 border-rose-500 shadow-[0_0_22px_rgba(244,63,94,.75)]" style={markerStyle(signals.phoneBox)}>
      <span className="absolute -top-6 left-0 whitespace-nowrap rounded-t-md bg-rose-500 px-2 py-1 text-[8px] font-black text-white">PHONE · {percentage(signals.phoneConfidence)} · {signals.phoneModel ?? "MODEL"}</span>
    </div>}
    {!baseline && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-violet-300/40 bg-violet-950/80 px-4 py-2 text-[9px] font-black text-violet-100 backdrop-blur">Calibrate to enable direction markers</div>}
  </div>;
}

function MarkerBadge({ label, danger }: { label: string; danger: boolean }) {
  return <span className={cn("rounded-full border px-2.5 py-1 text-[8px] font-black text-white backdrop-blur", danger ? "border-rose-400/60 bg-rose-600/85" : "border-white/20 bg-zinc-950/70")}>{label}</span>;
}
