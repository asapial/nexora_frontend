"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RiAlertLine, RiCameraLine, RiCheckboxCircleLine, RiComputerLine, RiEyeLine,
  RiFileList3Line, RiFullscreenLine, RiInformationLine, RiLightbulbLine,
  RiLoader4Line, RiLockLine, RiPhoneLine, RiRestartLine, RiShieldCheckLine, RiTimeLine,
  RiUserLine, RiWifiLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { ProModeVideoMarkers } from "@/components/examshield/ProModeVideoMarkers";
import { examApi } from "@/lib/api";
import { ProctorPolicy } from "@/lib/examShield";
import { ProctorCalibrationBuffer } from "@/lib/examshield-kit/calibration";
import { ProctorBaseline, ProctorDecision, ProctorDecisionTracker } from "@/lib/examshield-kit/decision";
import { startVideoFrameLoop } from "@/lib/examshield-kit/frame-loop";
import { ExamShieldVision, VisionSignals } from "@/lib/examshield-kit/vision";
import { cn } from "@/lib/utils";

type AccessData = {
  exam: {
    id: string;
    title: string;
    description?: string | null;
    examMode: "REGULAR" | "PRO";
    startTime: string;
    endTime: string;
    durationMinutes?: number | null;
  };
  proctorPolicy?: ProctorPolicy | null;
};

const snapshotEventTypes = new Set([
  "FACE_NOT_VISIBLE",
  "MULTIPLE_FACES",
  "HEAD_TURN_HORIZONTAL",
  "EYE_MOVEMENT_HORIZONTAL",
  "PHONE_DETECTED",
  "DEVICE_DETECTED",
]);

export default function ExamRunnerPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const [access, setAccess] = useState<AccessData | null>(null);
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; textAnswer?: string }>>({});
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [consent, setConsent] = useState(false);
  const [cameraState, setCameraState] = useState<"IDLE" | "REQUESTING" | "READY" | "INTERRUPTED">("IDLE");
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const [detectorSupported, setDetectorSupported] = useState(false);
  const [deviceDetectionSupported, setDeviceDetectionSupported] = useState(false);
  const [visionError, setVisionError] = useState("");
  const [liveSignals, setLiveSignals] = useState<VisionSignals | null>(null);
  const [liveDecisions, setLiveDecisions] = useState<ProctorDecision[]>([]);
  const [preflightBaseline, setPreflightBaseline] = useState<ProctorBaseline | null>(null);
  const submitted = useRef(false);
  const startedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const visionRef = useRef<ExamShieldVision | null>(null);
  const signalsRef = useRef<VisionSignals | null>(null);
  const baselineRef = useRef<ProctorBaseline | null>(null);
  const calibrationBufferRef = useRef(new ProctorCalibrationBuffer());
  const decisionTrackerRef = useRef(new ProctorDecisionTracker());
  const lastCameraEvent = useRef<Record<string, number>>({});
  const lastDeliveryError = useRef(0);
  const lastFaceUiUpdate = useRef(0);
  const lastMarkerUiUpdate = useRef(0);
  const lastDecisionUiUpdate = useRef(0);
  const fullscreenExitHandled = useRef(false);

  useEffect(() => { startedRef.current = started; }, [started]);
  useEffect(() => {
    examApi.studentAccess(examId)
      .then((response) => setAccess(response.data as AccessData))
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Could not load exam access"));
  }, [examId]);

  const captureSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return undefined;
    const width = Math.min(640, video.videoWidth);
    const height = Math.round((video.videoHeight / video.videoWidth) * width);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.58);
  }, []);

  const log = useCallback(async (type: string, metadata?: Record<string, unknown>, durationMs?: number, confidence?: number) => {
    if (!startedRef.current || submitted.current) return;
    try {
      const snapshotDataUrl = access?.exam.examMode === "PRO"
        && access.proctorPolicy?.snapshotEnabled
        && snapshotEventTypes.has(type)
        ? captureSnapshot()
        : undefined;
      await examApi.violation(examId, {
        clientEventId: crypto.randomUUID(),
        type,
        pageUrl: location.href,
        referrer: document.referrer,
        metadata,
        durationMs,
        confidence,
        snapshotDataUrl,
      });
    } catch (error: unknown) {
      const now = Date.now();
      if (now - lastDeliveryError.current >= 20000) {
        lastDeliveryError.current = now;
        toast.error(error instanceof Error ? `Proctor alert delivery failed: ${error.message}` : "Proctor alert delivery failed");
      }
    }
  }, [access, captureSnapshot, examId]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    visionRef.current?.close();
    visionRef.current = null;
    calibrationBufferRef.current.reset();
    decisionTrackerRef.current.reset();
  }, []);

  const requestCamera = async () => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Pro Mode requires a secure browser context with camera support");
      return;
    }
    stopCamera();
    setDetectorSupported(false);
    setDeviceDetectionSupported(false);
    setFaceCount(null);
    setLiveSignals(null);
    setLiveDecisions([]);
    setPreflightBaseline(null);
    baselineRef.current = null;
    setVisionError("");
    setCameraState("REQUESTING");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const vision = new ExamShieldVision();
      const support = await vision.initialize();
      if (!support.deviceDetectionSupported) {
        vision.close();
        throw new Error("Phone and device detection could not initialize");
      }
      visionRef.current = vision;
      setDetectorSupported(true);
      setDeviceDetectionSupported(true);
      setVisionError("");
      const initial = vision.analyze(videoRef.current!, performance.now());
      signalsRef.current = initial;
      calibrationBufferRef.current.push(initial);
      setLiveSignals(initial);
      setFaceCount(initial.faceCount);
      setDeviceDetectionSupported(initial.deviceDetectorHealthy);
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setCameraState("INTERRUPTED");
        log("CAMERA_INTERRUPTED", { reason: "camera-track-ended" }, 1000, 1);
      });
      setCameraState("READY");
    } catch (error) {
      setCameraState("INTERRUPTED");
      setVisionError(error instanceof Error ? error.message : "Advanced vision monitoring could not start");
      stopCamera();
      toast.error("Pro Mode vision monitoring could not start. Check your connection and camera permission.");
    }
  };

  const calibrate = useCallback(() => {
    const signals = signalsRef.current;
    if (!signals || signals.faceCount !== 1) {
      toast.error("Keep exactly one face visible and look naturally at the screen before calibrating");
      return;
    }
    const result = calibrationBufferRef.current.createBaseline();
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    const baseline = result.baseline;
    baselineRef.current = baseline;
    setPreflightBaseline(baseline);
    decisionTrackerRef.current.reset();
    toast.success(`Pro Mode tracking calibrated from ${result.sampleCount} stable frames`);
  }, []);

  const analyzeVision = useCallback(() => {
    if (!visionRef.current || !videoRef.current || videoRef.current.readyState < 2) return null;
    try {
      const signals = visionRef.current.analyze(videoRef.current, performance.now());
      signalsRef.current = signals;
      calibrationBufferRef.current.push(signals);
      const now = performance.now();
      if (now - lastFaceUiUpdate.current >= 100) {
        lastFaceUiUpdate.current = now;
        setFaceCount(signals.faceCount);
        setDeviceDetectionSupported(signals.deviceDetectorHealthy);
        if (!signals.deviceDetectorHealthy) setVisionError("Phone and device detection was interrupted; face tracking remains active");
      }
      if (now - lastMarkerUiUpdate.current >= 66) {
        lastMarkerUiUpdate.current = now;
        setLiveSignals(signals);
      }
      return signals;
    } catch {
      setCameraState("INTERRUPTED");
      setDetectorSupported(false);
      setVisionError("Advanced vision monitoring was interrupted");
      const now = Date.now();
      if (now - (lastCameraEvent.current.CAMERA_INTERRUPTED ?? 0) >= 20000) {
        log("CAMERA_INTERRUPTED", { reason: "vision-analysis-failed" }, 1000, 1);
        lastCameraEvent.current.CAMERA_INTERRUPTED = now;
      }
      return null;
    }
  }, [log]);

  useEffect(() => {
    if (started || cameraState !== "READY" || detectorSupported === false) return;
    const video = videoRef.current;
    if (!video) return;
    return startVideoFrameLoop(video, () => analyzeVision(), 24);
  }, [analyzeVision, cameraState, detectorSupported, started]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!started || !video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {
      setCameraState("INTERRUPTED");
      setVisionError("Camera stream could not resume after the exam started");
      log("CAMERA_INTERRUPTED", { reason: "exam-video-reattach-failed" }, 1000, 1);
    });
  }, [log, started]);

  useEffect(() => {
    if (!started || access?.exam.examMode !== "PRO" || !detectorSupported) return;
    const sensitivity = access.proctorPolicy?.sensitivity ?? "STANDARD";
    const video = videoRef.current;
    if (!video) return;
    return startVideoFrameLoop(video, () => {
      const signals = analyzeVision();
      if (!signals) return;
      const now = Date.now();
      const decisions = decisionTrackerRef.current.update(signals, baselineRef.current, sensitivity, now, {
        roughPaperAllowed: access.proctorPolicy?.roughPaperAllowed,
      });
      if (performance.now() - lastDecisionUiUpdate.current >= 66) {
        lastDecisionUiUpdate.current = performance.now();
        setLiveDecisions(decisions);
      }
      decisions.filter((decision) => decision.triggered).forEach((decision) => {
        log(
          decision.type,
          { faceCount: signals.faceCount, detector: "mediapipe", ...decision.metadata },
          decision.sustainedMs,
          decision.confidence,
        );
      });
    }, 24);
  }, [access, analyzeVision, detectorSupported, log, started]);

  const submit = useCallback(async (auto = false, reason: "TIME_EXPIRED" | "FULLSCREEN_EXIT" = "TIME_EXPIRED") => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    try {
      await examApi.submit(examId, Object.entries(answers).map(([questionId, answer]) => ({ questionId, ...answer })), auto);
      stopCamera();
      toast.success(auto ? reason === "FULLSCREEN_EXIT" ? "Fullscreen was exited. Exam auto-submitted." : "Time expired. Exam auto-submitted." : "Exam submitted");
      router.push("/dashboard/student/exams");
    } catch (error: unknown) {
      submitted.current = false;
      toast.error(error instanceof Error ? error.message : "Could not submit exam");
    } finally {
      setSubmitting(false);
    }
  }, [answers, examId, router, stopCamera]);

  const begin = async () => {
    try {
      let preflightToken: string | undefined;
      if (access?.exam.examMode === "PRO") {
        if (!consent || cameraState !== "READY") throw new Error("Complete consent and camera setup before starting");
        if (!detectorSupported) throw new Error("Advanced Pro Mode monitoring is not ready");
        if (!deviceDetectionSupported) throw new Error("Phone and device detection is not ready");
        if (faceCount !== 1) throw new Error("Keep exactly one face visible before starting");
        if (!preflightBaseline) throw new Error("Calibrate direction tracking before starting");
        const settings = streamRef.current?.getVideoTracks()[0]?.getSettings();
        const preflight = await examApi.proctorPreflight(examId, {
          consent: true,
          cameraReady: true,
          faceCount: detectorSupported ? faceCount : undefined,
          calibration: {
            cameraWidth: settings?.width ?? 640,
            cameraHeight: settings?.height ?? 480,
            detectorSupported,
          },
        });
        preflightToken = preflight.data.preflightToken;
      }
      await document.documentElement.requestFullscreen();
      const data = (await examApi.start(examId, preflightToken)).data;
      setExam(data);
      setStarted(true);
      const hardEnd = new Date(data.endTime).getTime();
      const durationEnd = data.durationMinutes ? new Date(data.startedAt).getTime() + data.durationMinutes * 60000 : hardEnd;
      setSeconds(Math.max(0, Math.floor((Math.min(hardEnd, durationEnd) - Date.now()) / 1000)));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not start exam");
    }
  };

  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => setSeconds((current) => {
      if (current <= 1) {
        clearInterval(timer);
        submit(true);
        return 0;
      }
      return current - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [started, submit]);

  useEffect(() => {
    if (!started) return;
    const visibility = () => document.hidden && log("TAB_HIDDEN");
    const blur = () => log("WINDOW_BLUR");
    const fullscreen = () => {
      if (document.fullscreenElement || fullscreenExitHandled.current) return;
      fullscreenExitHandled.current = true;
      void (async () => {
        await log("FULLSCREEN_EXIT", { reason: "fullscreen-exited", autoSubmitted: true }, 0, 1);
        await submit(true, "FULLSCREEN_EXIT");
      })();
    };
    const copy = (event: Event) => { event.preventDefault(); log("COPY_ATTEMPT"); };
    const paste = (event: Event) => { event.preventDefault(); log("PASTE_ATTEMPT"); };
    const before = () => log("PAGE_EXIT", { reason: "refresh-or-close" });
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    document.addEventListener("fullscreenchange", fullscreen);
    document.addEventListener("copy", copy);
    document.addEventListener("paste", paste);
    window.addEventListener("beforeunload", before);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      document.removeEventListener("fullscreenchange", fullscreen);
      document.removeEventListener("copy", copy);
      document.removeEventListener("paste", paste);
      window.removeEventListener("beforeunload", before);
    };
  }, [log, started, submit]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  if (!access) return <div className="mx-auto max-w-xl p-8"><div className="h-80 animate-pulse rounded-3xl bg-muted" /></div>;
  if (!started) return <ExamEntry access={access} begin={begin} calibrate={calibrate} cameraState={cameraState} consent={consent} detectorSupported={detectorSupported} deviceDetectionSupported={deviceDetectionSupported} faceCount={faceCount} liveSignals={liveSignals} preflightBaseline={preflightBaseline} requestCamera={requestCamera} setConsent={setConsent} videoRef={videoRef} visionError={visionError} />;

  const clock = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  return <div className="min-h-screen select-none bg-background">
    {exam.examMode === "PRO" && <div className="fixed bottom-4 left-4 z-30 w-56 overflow-hidden rounded-2xl border border-teal-500/30 bg-zinc-950 shadow-2xl"><div className="relative aspect-[4/3]"><video ref={videoRef} muted playsInline className="h-full w-full object-contain" />{liveSignals && <ProModeVideoMarkers signals={liveSignals} baseline={baselineRef.current} decisions={liveDecisions} compact />}</div><div className="flex items-center justify-between bg-teal-600 px-2.5 py-1.5 text-[7px] font-extrabold uppercase tracking-wider text-white"><span>Pro monitoring active</span><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /></div></div>}
    <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600"><RiShieldCheckLine /></div>
      <div className="flex-1"><h1 className="text-[14px] font-extrabold">{exam.title}</h1><p className="text-[10px] text-muted-foreground">{exam.examMode === "PRO" ? "Pro Mode camera monitoring active" : "Regular Mode browser monitoring active"}</p></div>
      {exam.examMode === "PRO" && <div className={cn("hidden rounded-full border px-3 py-1.5 text-[9px] font-extrabold sm:block", cameraState === "READY" ? "border-teal-500/20 bg-teal-500/10 text-teal-600" : "border-rose-500/20 bg-rose-500/10 text-rose-600")}><RiCameraLine className="mr-1 inline" />{cameraState === "READY" ? "Camera active" : "Camera interrupted"}</div>}
      <div className={cn("flex items-center gap-2 rounded-xl border px-4 py-2 font-mono font-bold", seconds < 300 ? "border-rose-300 bg-rose-500/10 text-rose-600" : "border-teal-300 bg-teal-500/10 text-teal-600")}><RiTimeLine />{clock}</div>
      <button onClick={() => submit(false)} disabled={submitting} className="flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-4 text-[12px] font-bold text-white">{submitting ? <RiLoader4Line className="animate-spin" /> : <RiCheckboxCircleLine />}Submit</button>
    </div>
    <div className="mx-auto max-w-3xl space-y-5 p-5 lg:p-8">{exam.questions.map((question: any, index: number) => <section key={question.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex justify-between gap-3"><h2 className="text-[14px] font-extrabold leading-relaxed"><span className="mr-2 text-teal-600">{index + 1}.</span>{question.prompt}</h2><span className="shrink-0 text-[10px] font-bold text-muted-foreground">{question.marks} marks</span></div>{question.type === "MCQ" ? <div className="mt-4 space-y-2">{question.options.map((option: any) => <label key={option.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors", answers[question.id]?.optionId === option.id ? "border-teal-400 bg-teal-500/10" : "border-border hover:bg-muted/30")}><input type="radio" name={question.id} checked={answers[question.id]?.optionId === option.id} onChange={() => setAnswers((current) => ({ ...current, [question.id]: { optionId: option.id } }))} /><span className="text-[13px]">{option.text}</span></label>)}</div> : <textarea rows={8} className="mt-4 w-full resize-y rounded-xl border border-border bg-muted/20 p-3 text-[13px] outline-none focus:ring-2 focus:ring-teal-400/20" placeholder="Write your answer..." value={answers[question.id]?.textAnswer ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: { textAnswer: event.target.value } }))} />}</section>)}</div>
  </div>;
}

function ExamEntry({ access, begin, calibrate, cameraState, consent, detectorSupported, deviceDetectionSupported, faceCount, liveSignals, preflightBaseline, requestCamera, setConsent, videoRef, visionError }: {
  access: AccessData;
  begin: () => void;
  calibrate: () => void;
  cameraState: "IDLE" | "REQUESTING" | "READY" | "INTERRUPTED";
  consent: boolean;
  detectorSupported: boolean;
  faceCount: number | null;
  liveSignals: VisionSignals | null;
  deviceDetectionSupported: boolean;
  preflightBaseline: ProctorBaseline | null;
  requestCamera: () => void;
  setConsent: (value: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  visionError: string;
}) {
  const pro = access.exam.examMode === "PRO";
  const cameraReady = cameraState === "READY";
  const faceReady = cameraReady && detectorSupported && faceCount === 1;
  const calibrationReady = liveSignals !== null
    && liveSignals.headYaw !== null
    && liveSignals.headPitch !== null
    && liveSignals.headRoll !== null
    && liveSignals.eyeHorizontal !== null
    && liveSignals.eyeVertical !== null
    && liveSignals.leftEyeHorizontal !== null
    && liveSignals.rightEyeHorizontal !== null
    && liveSignals.leftEyeVertical !== null
    && liveSignals.rightEyeVertical !== null;
  const trackingReady = cameraReady && detectorSupported && calibrationReady;
  const deviceReady = cameraReady && deviceDetectionSupported;
  const calibrated = trackingReady && preflightBaseline !== null;
  const ready = !pro || (consent && cameraReady && faceReady && trackingReady && deviceReady && calibrated);
  const checks = [consent, cameraReady, faceReady, trackingReady && deviceReady, calibrated];
  const completedChecks = checks.filter(Boolean).length;
  const policy = access.proctorPolicy;
  const duration = access.exam.durationMinutes ? `${access.exam.durationMinutes} minutes` : "Until exam deadline";
  const startsAt = new Date(access.exam.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  const endsAt = new Date(access.exam.endTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  return <main className="min-h-screen bg-gradient-to-b from-teal-500/[.06] via-background to-background">
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-3xl border border-teal-500/20 bg-card shadow-xl shadow-teal-950/5">
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-500/15 via-card to-violet-500/[.06] p-6 sm:p-8">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-teal-700 dark:text-teal-300">
                {pro ? <RiCameraLine /> : <RiShieldCheckLine />}{pro ? "ExamShield Pro Mode" : "ExamShield Regular Mode"}
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">{access.exam.title}</h1>
              <p className="mt-2 max-w-xl text-[12px] leading-6 text-muted-foreground">
                {access.exam.description || (pro ? "Review the rules, complete consent, and pass the camera readiness check before your attempt begins." : "Review the exam details before entering fullscreen and beginning your attempt.")}
              </p>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[390px]">
              <ExamFact icon={<RiTimeLine />} label="Duration" value={duration} />
              <ExamFact icon={<RiFullscreenLine />} label="Environment" value="Fullscreen" />
              <ExamFact icon={pro ? <RiEyeLine /> : <RiShieldCheckLine />} label="Monitoring" value={pro ? "Pro Mode" : "Regular"} />
            </div>
          </div>
          <div className="relative mt-6 grid gap-2 border-t border-border/60 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProgressStep number={1} label="Review exam rules" complete />
            <ProgressStep number={2} label={pro ? "Give informed consent" : "Prepare your browser"} complete={!pro || consent} />
            <ProgressStep number={3} label={pro ? "Pass camera check" : "Enter fullscreen"} complete={!pro || (cameraReady && faceReady && trackingReady && deviceReady)} />
            <ProgressStep number={4} label="Start the exam" complete={false} />
          </div>
        </div>
      </section>

      {pro ? <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionHeading icon={<RiFileList3Line />} eyebrow="Read before starting" title="Exam rules and monitoring" description="These rules protect the fairness of the exam and explain how Pro Mode evidence is handled." />
            <div className="mt-5 flex gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-300">
              <RiAlertLine className="mt-0.5 shrink-0 text-lg" />
              <div><p className="text-[12px] font-black">Exiting fullscreen automatically submits your exam</p><p className="mt-1 text-[10px] leading-5 opacity-90">Do not press Escape, switch applications, refresh, close the page, or leave fullscreen after starting.</p></div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <RuleCard icon={<RiComputerLine />} title="Browser integrity" text="Tab switching, window changes, copy or paste attempts, page refreshes, and page exits are recorded for teacher review." tone="violet" />
              <RuleCard icon={<RiUserLine />} title="Camera position" text="Keep exactly one face visible with your full head in frame, good lighting, and no other person nearby." />
              <RuleCard icon={<RiEyeLine />} title="Head and eye movement" text={`Sustained horizontal movement may create a warning. ${policy?.roughPaperAllowed ? "Looking down for permitted rough work is allowed." : "Rough-paper use is not permitted for this exam."}`} tone="amber" />
              <RuleCard icon={<RiPhoneLine />} title="Phones and devices" text="Keep phones, smart devices, headphones, notes, and unrelated materials outside the camera frame and out of reach." tone="rose" />
              <RuleCard icon={<RiLockLine />} title="Privacy and evidence" text={policy?.snapshotEnabled ? `Camera analysis runs on this device. A compressed snapshot is uploaded only with a sustained warning and retained for ${policy.evidenceRetentionDays ?? 30} days.` : "Camera analysis runs on this device. Snapshot evidence is disabled for this exam."} />
              <RuleCard icon={<RiShieldCheckLine />} title="Human review" text="Warnings do not automatically fail your exam or declare misconduct. Your teacher reviews and confirms any suspected violation." tone="violet" />
              <RuleCard icon={<RiWifiLine />} title="Before starting" text="Use a stable connection, connect your charger, silence notifications, and close every unrelated tab and application." tone="amber" />
              <RuleCard icon={<RiInformationLine />} title="Exam window" text={`The exam is available from ${startsAt} until ${endsAt}. Submit before time expires.`} />
            </div>
          </section>

          <label className={cn("flex cursor-pointer gap-4 rounded-3xl border bg-card p-5 shadow-sm transition-colors sm:p-6", consent ? "border-teal-500/35 bg-teal-500/[.06]" : "border-border hover:border-teal-500/30")}>
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-teal-600" />
            <div>
              <p className="text-[12px] font-black">Informed consent</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">I have read the rules and consent to Pro Mode face, head, eye, phone, and other-device monitoring for this exam.</p>
            </div>
            {consent && <RiCheckboxCircleLine className="ml-auto shrink-0 text-xl text-teal-600" />}
          </label>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-5">
          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
            <div className="p-5">
              <SectionHeading icon={<RiCameraLine />} eyebrow="Step 3 of 4" title="Camera readiness check" description="Center your face and look naturally at the screen." compact />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden border-y border-border bg-zinc-950">
              <video ref={videoRef} muted playsInline className="h-full w-full object-contain" />
              {liveSignals && <ProModeVideoMarkers signals={liveSignals} baseline={preflightBaseline} decisions={[]} showCalibrationHint={false} />}
              {cameraState !== "READY" && <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/85 text-center text-zinc-300"><span className="text-[11px] font-bold"><RiCameraLine className="mx-auto mb-3 text-3xl text-teal-400" />Your camera preview<br /><span className="font-normal text-zinc-500">Permission is only requested when you run the check</span></span></div>}
            </div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-2">
                <ReadinessItem label="Camera" ready={cameraReady} />
                <ReadinessItem label="One face" ready={faceReady} />
                <ReadinessItem label="Head & eyes" ready={trackingReady} />
                <ReadinessItem label="Device detector" ready={deviceReady} />
                <ReadinessItem label="Calibrated" ready={calibrated} />
              </div>
              {visionError && <div className="flex gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-[10px] font-bold leading-4 text-rose-700 dark:text-rose-300"><RiAlertLine className="shrink-0" />{visionError}</div>}
              {cameraReady && !visionError && faceCount !== 1 && <div className="flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-[10px] font-bold leading-4 text-amber-700 dark:text-amber-300"><RiLightbulbLine className="shrink-0" />{faceCount === 0 ? "No face detected. Improve lighting and center yourself." : "More than one face is visible. Only the student should remain in frame."}</div>}
              <button onClick={requestCamera} disabled={cameraState === "REQUESTING"} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 text-[11px] font-black text-teal-700 transition-colors hover:bg-teal-500/15 disabled:opacity-50 dark:text-teal-300">{cameraState === "REQUESTING" ? <RiLoader4Line className="animate-spin" /> : <RiCameraLine />}{cameraState === "READY" ? "Run camera check again" : "Run camera readiness check"}</button>
              <button onClick={calibrate} disabled={!faceReady || !trackingReady} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-[11px] font-black text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"><RiRestartLine />{calibrated ? "Recalibrate direction tracking" : "Calibrate direction tracking"}</button>
              <p className="text-center text-[9px] leading-4 text-muted-foreground">{calibrated ? "Calibration is ready. Recalibrate if you move your chair or camera." : "Sit naturally, face the screen, then calibrate your neutral position."}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ready to begin</p><p className="mt-1 text-[13px] font-black">{completedChecks} of 5 requirements complete</p></div><div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl text-lg", ready ? "bg-teal-500/10 text-teal-600" : "bg-amber-500/10 text-amber-600")}>{ready ? <RiShieldCheckLine /> : <RiTimeLine />}</div></div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${completedChecks * 20}%` }} /></div>
            <div className="mt-4 space-y-2">
              <StartRequirement label="Rules reviewed and consent given" complete={consent} />
              <StartRequirement label="Camera permission and preview ready" complete={cameraReady} />
              <StartRequirement label="Exactly one face clearly visible" complete={faceReady} />
              <StartRequirement label="Advanced detectors initialized" complete={trackingReady && deviceReady} />
              <StartRequirement label="Neutral direction position calibrated" complete={calibrated} />
            </div>
            <button onClick={begin} disabled={!ready} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 text-[12px] font-black text-white shadow-lg shadow-teal-600/20 transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"><RiFullscreenLine />Enter fullscreen & start exam</button>
            <p className="mt-3 text-center text-[9px] leading-4 text-muted-foreground">{ready ? "Starting will enter fullscreen and begin the exam timer." : "Complete every requirement above to enable the start button."}</p>
          </section>
        </aside>
      </div> : <section className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-lg">
        <SectionHeading icon={<RiShieldCheckLine />} eyebrow="Before starting" title="Prepare your exam environment" description="Your attempt starts immediately after you enter fullscreen." />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <RuleCard icon={<RiFullscreenLine />} title="Stay in fullscreen" text="Exiting fullscreen automatically submits your exam." tone="rose" />
          <RuleCard icon={<RiComputerLine />} title="Close unrelated tabs" text="Tab switching, refreshes, copy, paste, and page exits are recorded." tone="violet" />
          <RuleCard icon={<RiWifiLine />} title="Stable connection" text="Use reliable internet, connect your charger, and silence notifications." />
          <RuleCard icon={<RiTimeLine />} title="Exam window" text={`Available from ${startsAt} until ${endsAt}. Duration: ${duration}.`} tone="amber" />
        </div>
        <button onClick={begin} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 text-[12px] font-black text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700"><RiFullscreenLine />Enter fullscreen & start exam</button>
      </section>}
    </div>
  </main>;
}

function ExamFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-border/70 bg-background/60 p-3 backdrop-blur"><div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground">{icon}{label}</div><p className="mt-1.5 truncate text-[11px] font-black">{value}</p></div>;
}

function ProgressStep({ number, label, complete }: { number: number; label: string; complete: boolean }) {
  return <div className="flex items-center gap-2 rounded-xl bg-background/50 p-2.5"><span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black", complete ? "bg-teal-600 text-white" : "bg-muted text-muted-foreground")}>{complete ? <RiCheckboxCircleLine /> : number}</span><span className="text-[10px] font-bold">{label}</span></div>;
}

function SectionHeading({ icon, eyebrow, title, description, compact = false }: { icon: React.ReactNode; eyebrow: string; title: string; description: string; compact?: boolean }) {
  return <div className="flex gap-3"><div className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600", compact ? "h-10 w-10 text-base" : "h-11 w-11 text-lg")}>{icon}</div><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-600">{eyebrow}</p><h2 className={cn("mt-1 font-black", compact ? "text-[13px]" : "text-base")}>{title}</h2><p className="mt-1 text-[10px] leading-5 text-muted-foreground">{description}</p></div></div>;
}

function RuleCard({ icon, title, text, tone = "teal" }: { icon: React.ReactNode; title: string; text: string; tone?: "teal" | "violet" | "amber" | "rose" }) {
  const tones = { teal: "bg-teal-500/10 text-teal-600", violet: "bg-violet-500/10 text-violet-600", amber: "bg-amber-500/10 text-amber-600", rose: "bg-rose-500/10 text-rose-600" };
  return <div className="flex gap-3 rounded-2xl border border-border bg-muted/[.12] p-4"><div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base", tones[tone])}>{icon}</div><div><h3 className="text-[11px] font-black">{title}</h3><p className="mt-1 text-[9px] leading-[1.15rem] text-muted-foreground">{text}</p></div></div>;
}

function ReadinessItem({ label, ready }: { label: string; ready: boolean }) {
  return <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[9px] font-black", ready ? "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300" : "border-border bg-muted/20 text-muted-foreground")}><span className={cn("h-2 w-2 rounded-full", ready ? "bg-teal-500" : "bg-muted-foreground/40")} />{label}</div>;
}

function StartRequirement({ label, complete }: { label: string; complete: boolean }) {
  return <div className="flex items-center gap-2 text-[10px] font-bold"><RiCheckboxCircleLine className={cn("shrink-0 text-sm", complete ? "text-teal-600" : "text-muted-foreground/40")} /><span className={complete ? "text-foreground" : "text-muted-foreground"}>{label}</span></div>;
}
