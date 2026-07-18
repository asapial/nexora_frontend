"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiAlertLine, RiCameraLine, RiCheckboxCircleLine, RiEyeLine,
  RiFocus3Line, RiLoader4Line, RiPhoneLine, RiRefreshLine, RiShieldCheckLine, RiStopCircleLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { ExamShieldHeader, ExamShieldRoleNav, MetricCard } from "@/components/examshield/ExamShieldUI";
import { ProModeVideoMarkers } from "@/components/examshield/ProModeVideoMarkers";
import { ProctorSensitivity } from "@/lib/examShield";
import { ProctorCalibrationBuffer } from "@/lib/examshield-kit/calibration";
import {
  getProctorDecisionConfig, ProctorBaseline, ProctorDecisionTracker, ProctorSignalType, TrackedProctorDecision,
} from "@/lib/examshield-kit/decision";
import { startVideoFrameLoop } from "@/lib/examshield-kit/frame-loop";
import { createEmptyVisionSignals, ExamShieldVision, VisionSignals } from "@/lib/examshield-kit/vision";
import { cn } from "@/lib/utils";

type LabState = "IDLE" | "STARTING" | "RUNNING" | "ERROR";
type DecisionRow = TrackedProctorDecision;
type LabEvent = DecisionRow & { id: string; occurredAt: number };

const emptySignals = createEmptyVisionSignals();
const signalLabels: Record<ProctorSignalType, string> = {
  FACE_NOT_VISIBLE: "Face not visible",
  MULTIPLE_FACES: "Multiple faces",
  HEAD_TURN_HORIZONTAL: "Head movement",
  EYE_MOVEMENT_HORIZONTAL: "Eye movement",
  PHONE_DETECTED: "Visible phone",
  DEVICE_DETECTED: "Other visible device",
};

const percentage = (value: number | null) => value === null ? "Not detected" : `${Math.round(value * 100)}%`;
const decimal = (value: number | null) => value === null ? "Waiting" : value.toFixed(3);

export default function ExamShieldLabPage() {
  const [labState, setLabState] = useState<LabState>("IDLE");
  const [sensitivity, setSensitivity] = useState<ProctorSensitivity>("STANDARD");
  const [roughPaperAllowed, setRoughPaperAllowed] = useState(false);
  const [signals, setSignals] = useState<VisionSignals>(emptySignals);
  const [baseline, setBaseline] = useState<ProctorBaseline | null>(null);
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [deviceReady, setDeviceReady] = useState(false);
  const [deviceModel, setDeviceModel] = useState<string | null>(null);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const visionRef = useRef<ExamShieldVision | null>(null);
  const calibrationBufferRef = useRef(new ProctorCalibrationBuffer());
  const signalsRef = useRef<VisionSignals>(emptySignals);
  const trackerRef = useRef(new ProctorDecisionTracker());
  const lastUiUpdateRef = useRef(0);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    visionRef.current?.close();
    visionRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    trackerRef.current.reset();
    calibrationBufferRef.current.reset();
    setLabState("IDLE");
    setDeviceReady(false);
    setDeviceModel(null);
    setSignals(createEmptyVisionSignals());
    signalsRef.current = createEmptyVisionSignals();
    setBaseline(null);
    setDecisions([]);
    setEvents([]);
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
      setDeviceReady(support.deviceDetectionSupported);
      setDeviceModel(support.deviceModel);
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
    if (current.faceCount !== 1) {
      toast.error("Keep exactly one face visible and look naturally at the screen");
      return;
    }
    const result = calibrationBufferRef.current.createBaseline();
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    setBaseline(result.baseline);
    trackerRef.current.reset();
    setEvents([]);
    toast.success(result.eyeTrackingAvailable
      ? `Neutral position calibrated from ${result.sampleCount} stable frames`
      : "Head baseline calibrated; eye decisions are disabled because glare or occlusion made iris tracking unreliable.");
  };

  const resetTimeline = () => {
    trackerRef.current.reset();
    setDecisions([]);
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
        signalsRef.current = nextSignals;
        calibrationBufferRef.current.push(nextSignals);
        const nextDecisions = trackerRef.current.update(nextSignals, baseline, sensitivity, now, { roughPaperAllowed });
        const triggered = nextDecisions.filter((decision) => decision.triggered);
        if (triggered.length) {
          setEvents((current) => [
            ...triggered.map((decision) => ({ ...decision, id: crypto.randomUUID(), occurredAt: now })),
            ...current,
          ].slice(0, 30));
        }
        if (performance.now() - lastUiUpdateRef.current >= 80) {
          lastUiUpdateRef.current = performance.now();
          setSignals(nextSignals);
          setDecisions(nextDecisions);
        }
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Vision analysis failed";
        stop();
        setError(message);
        setLabState("ERROR");
      }
    }, 24);
  }, [baseline, labState, roughPaperAllowed, sensitivity, stop]);

  useEffect(() => {
    trackerRef.current.reset();
    calibrationBufferRef.current.reset();
    setBaseline(null);
    setDecisions([]);
    setEvents([]);
  }, [roughPaperAllowed, sensitivity]);

  useEffect(() => () => stop(), [stop]);

  const config = getProctorDecisionConfig(sensitivity);
  const primaryDevice = signals.detectedDevices[0] ?? null;
  const activeCount = decisions.filter((decision) => decision.active).length;
  const triggeredCount = events.length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 lg:p-8">
      <ExamShieldHeader
        eyebrow="Admin · ExamShield diagnostics"
        title="Pro Mode detection lab"
        description="Test the same local camera model and decision boundaries used by a Pro Mode exam. This isolated lab never records violations, creates notifications, or affects a student."
      />
      <ExamShieldRoleNav role="admin" />

      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
        <RiAlertLine className="mr-2 inline text-base" />
        Treat detections as review signals, not proof of misconduct. Device detection only works when an object is clearly visible inside the camera frame.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Detector status" value={labState === "RUNNING" ? "24 FPS" : labState.toLowerCase()} note={deviceReady && signals.deviceDetectorHealthy ? `Face tracking + ${deviceModel ?? "device model"} at ${Math.round(1000 / signals.deviceScanIntervalMs)} scans/sec` : labState === "RUNNING" ? "Face tracking active; device detector unavailable" : "Start camera to initialize"} icon={<RiCameraLine />} />
        <MetricCard label="Faces visible" value={signals.faceCount} note="Exactly one face is expected" icon={<RiFocus3Line />} accent={signals.faceCount === 1 ? "teal" : "rose"} />
        <MetricCard label="Active candidates" value={activeCount} note="Signals currently above boundary" icon={<RiEyeLine />} accent={activeCount ? "rose" : "sky"} />
        <MetricCard label="Demo decisions" value={triggeredCount} note="Local events during this test" icon={<RiShieldCheckLine />} accent={triggeredCount ? "rose" : "violet"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div><h2 className="text-[14px] font-black">Camera and demo exam</h2><p className="mt-1 text-[10px] text-muted-foreground">Try a phone or laptop, move your head on any axis, or move only your eyes while watching the live decision panel.</p></div>
            <div className="flex flex-wrap gap-2">
              <select value={sensitivity} onChange={(event) => setSensitivity(event.target.value as ProctorSensitivity)} className="h-10 rounded-xl border border-border bg-muted/30 px-3 text-[11px] font-bold outline-none">
                <option value="RELAXED">Relaxed sensitivity</option>
                <option value="STANDARD">Standard sensitivity</option>
                <option value="STRICT">Strict sensitivity</option>
              </select>
              <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 text-[10px] font-bold text-muted-foreground">
                <input type="checkbox" checked={roughPaperAllowed} onChange={(event) => setRoughPaperAllowed(event.target.checked)} className="accent-teal-600" />
                Rough paper allowed
              </label>
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
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{baseline ? baseline.eyeTrackingAvailable === false ? "Head baseline captured. Eye decisions are safely disabled for unreliable iris tracking; spectacles remain allowed." : "Head and eye baseline captured. Decisions compare movement against this position." : "Look naturally at the screen, then capture your neutral position. Spectacles are supported."}</p>
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
            <RawValue label="Head yaw" value={decimal(signals.headYaw)} note={`Boundary ±${config.headYawDelta}`} />
            <RawValue label="Head pitch" value={decimal(signals.headPitch)} note={`Boundary ±${config.headPitchDelta}`} />
            <RawValue label="Head roll" value={decimal(signals.headRoll)} note={`Boundary ±${config.headRollDelta}`} />
            <RawValue label="Left eye horizontal" value={decimal(signals.leftEyeHorizontal)} note={`Movement boundary ±${config.eyeHorizontalDelta}`} />
            <RawValue label="Right eye horizontal" value={decimal(signals.rightEyeHorizontal)} note={`Movement boundary ±${config.eyeHorizontalDelta}`} />
            <RawValue label="Left eye vertical" value={decimal(signals.leftEyeVertical)} note={`Movement boundary ±${config.eyeVerticalDelta}`} />
            <RawValue label="Right eye vertical" value={decimal(signals.rightEyeVertical)} note={`Movement boundary ±${config.eyeVerticalDelta}`} />
            <RawValue label="Eye agreement" value={decimal(signals.eyeAgreement)} note={`Must be ≤ ${config.maxEyeDisagreement}`} />
            <RawValue label="Eye decision status" value={baseline?.eyeTrackingAvailable === false ? "Limited" : signals.eyeHorizontal === null ? "Unreliable" : "Available"} note="Glare or occlusion suppresses eye warnings only" />
            <RawValue label="Phone confidence" value={percentage(signals.phoneConfidence)} note={`Decision boundary ${Math.round(config.phoneConfidence * 100)}%`} />
            <RawValue label="Device detector" value={signals.deviceModel ?? deviceModel ?? "Waiting"} note={`${Math.round(1000 / signals.deviceScanIntervalMs)} scans/sec target`} />
            <RawValue label="Top device" value={primaryDevice?.label ?? "Not detected"} note={`Other-device boundary ${Math.round(config.deviceConfidence * 100)}%`} />
            <RawValue label="Device confidence" value={percentage(primaryDevice?.confidence ?? null)} note={`${signals.detectedDevices.length} confirmed device track(s)`} />
            <RawValue label="Confirmation scans" value={String(primaryDevice?.confirmationFrames ?? 0)} note="Same category and location must repeat" />
            <RawValue label="Device frame area" value={percentage(primaryDevice?.boxAreaRatio ?? null)} note="Implausibly tiny or oversized boxes are ignored" />
            <RawValue label="Device / face overlap" value={percentage(primaryDevice?.faceOverlap ?? null)} note="Near-face candidates receive additional checks" />
            <RawValue label="Eye-band overlap" value={percentage(primaryDevice?.eyeBandOverlap ?? null)} note={primaryDevice?.spectacleRisk ? "Spectacle-risk safeguard active" : "No spectacle-like geometry"} />
            <RawValue label="Frame processing" value={`${signals.processingTimeMs.toFixed(1)} ms`} note="Face frame plus scheduled device scan" />
            <RawValue label="Face count" value={String(signals.faceCount)} note="Expected: exactly 1" />
            <RawValue label="Baseline yaw" value={decimal(baseline?.headYaw ?? null)} note="Neutral reference" />
            <RawValue label="Baseline pitch" value={decimal(baseline?.headPitch ?? null)} note="Neutral reference" />
            <RawValue label="Baseline roll" value={decimal(baseline?.headRoll ?? null)} note="Neutral reference" />
            <RawValue label="Baseline left eye" value={decimal(baseline?.leftEyeHorizontal ?? null)} note="Neutral reference" />
            <RawValue label="Baseline right eye" value={decimal(baseline?.rightEyeHorizontal ?? null)} note="Neutral reference" />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-[14px] font-black">Local decision timeline</h2><p className="mt-1 text-[10px] text-muted-foreground">These demo decisions are not saved or sent anywhere.</p></div><button onClick={resetTimeline} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-[10px] font-bold"><RiRefreshLine /> Clear</button></div>
          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
            {events.length === 0 ? <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-[11px] text-muted-foreground">No decision has crossed its sustained threshold yet.</div> : events.map((event) => {
              const deviceEvent = event.type === "PHONE_DETECTED" || event.type === "DEVICE_DETECTED";
              return <div key={event.id} className={cn("flex items-center gap-3 rounded-xl border p-3", deviceEvent ? "border-rose-500/30 bg-rose-500/10" : "border-amber-500/25 bg-amber-500/5")}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card text-rose-600">{deviceEvent ? <RiPhoneLine /> : <RiAlertLine />}</span><div className="min-w-0 flex-1"><p className="text-[11px] font-black">{event.label}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{new Date(event.occurredAt).toLocaleTimeString()} · {(event.sustainedMs / 1000).toFixed(1)}s sustained · {Math.round(event.confidence * 100)}% confidence</p></div><RiCheckboxCircleLine className="text-teal-600" /></div>;
            })}
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
