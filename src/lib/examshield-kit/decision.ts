import type { ProctorSensitivity } from "@/lib/examShield";
import type { VisionDeviceDetection, VisionSignals } from "./vision";

export type ProctorBaseline = {
  headYaw: number;
  headPitch: number;
  headRoll: number;
  eyeHorizontal: number;
  eyeVertical: number;
  leftEyeHorizontal: number;
  rightEyeHorizontal: number;
  leftEyeVertical: number;
  rightEyeVertical: number;
};

export type ProctorSignalType =
  | "FACE_NOT_VISIBLE"
  | "MULTIPLE_FACES"
  | "HEAD_TURN_HORIZONTAL"
  | "EYE_MOVEMENT_HORIZONTAL"
  | "PHONE_DETECTED"
  | "DEVICE_DETECTED";

export type ProctorDecision = {
  type: ProctorSignalType;
  label: string;
  active: boolean;
  thresholdMs: number;
  confidence: number;
  metadata: Record<string, unknown>;
};

export type TrackedProctorDecision = ProctorDecision & {
  sustainedMs: number;
  triggered: boolean;
};

export type ProctorDecisionContext = {
  roughPaperAllowed?: boolean;
};

type SignalClock = {
  startedAt: number | null;
  lastPositiveAt: number | null;
  lastEmittedAt: number | null;
  lastObservedActive: boolean;
};

export const getProctorDecisionConfig = (sensitivity: ProctorSensitivity) => ({
  noFaceThreshold: sensitivity === "RELAXED" ? 4000 : sensitivity === "STRICT" ? 1400 : 2400,
  multipleThreshold: sensitivity === "RELAXED" ? 2000 : sensitivity === "STRICT" ? 700 : 1200,
  headThreshold: sensitivity === "RELAXED" ? 1400 : sensitivity === "STRICT" ? 500 : 800,
  eyeThreshold: sensitivity === "RELAXED" ? 1800 : sensitivity === "STRICT" ? 700 : 1000,
  phoneThreshold: sensitivity === "RELAXED" ? 1100 : sensitivity === "STRICT" ? 350 : 650,
  deviceThreshold: sensitivity === "RELAXED" ? 1400 : sensitivity === "STRICT" ? 500 : 850,
  headYawDelta: sensitivity === "RELAXED" ? 0.16 : sensitivity === "STRICT" ? 0.075 : 0.11,
  headPitchDelta: sensitivity === "RELAXED" ? 0.15 : sensitivity === "STRICT" ? 0.07 : 0.1,
  headRollDelta: sensitivity === "RELAXED" ? 0.14 : sensitivity === "STRICT" ? 0.065 : 0.095,
  eyeHorizontalDelta: sensitivity === "RELAXED" ? 0.075 : sensitivity === "STRICT" ? 0.035 : 0.05,
  eyeVerticalDelta: sensitivity === "RELAXED" ? 0.09 : sensitivity === "STRICT" ? 0.045 : 0.065,
  maxEyeDisagreement: sensitivity === "RELAXED" ? 0.16 : sensitivity === "STRICT" ? 0.1 : 0.13,
  phoneConfidence: sensitivity === "RELAXED" ? 0.52 : sensitivity === "STRICT" ? 0.32 : 0.42,
  deviceConfidence: sensitivity === "RELAXED" ? 0.6 : sensitivity === "STRICT" ? 0.4 : 0.5,
  cooldown: sensitivity === "RELAXED" ? 30000 : sensitivity === "STRICT" ? 15000 : 20000,
  signalGrace: sensitivity === "STRICT" ? 500 : sensitivity === "RELAXED" ? 1000 : 750,
});

const movementDirection = (axis: "yaw" | "pitch" | "roll", difference: number) => {
  if (axis === "pitch") return difference > 0 ? "down" : "up";
  return difference > 0 ? "right" : "left";
};

const gazeDirection = (axis: "horizontal" | "vertical", difference: number) => {
  if (axis === "vertical") return difference > 0 ? "down" : "up";
  return difference > 0 ? "right" : "left";
};

const bestDevice = (signals: VisionSignals, category: "phone" | "other"): VisionDeviceDetection | null => {
  const matching = signals.detectedDevices.filter((device) =>
    category === "phone" ? device.category === "cell phone" : device.category !== "cell phone",
  );
  return matching.sort((first, second) => second.confidence - first.confidence)[0] ?? null;
};

const deviceMetadata = (device: VisionDeviceDetection | null, fallback: Partial<VisionDeviceDetection> = {}) => ({
  category: device?.category ?? fallback.category ?? null,
  label: device?.label ?? fallback.label ?? null,
  model: device?.model ?? fallback.model ?? null,
  confidence: device?.confidence ?? fallback.confidence ?? null,
  boxAspectRatio: device?.boxAspectRatio ?? fallback.boxAspectRatio ?? null,
  boxAreaRatio: device?.boxAreaRatio ?? fallback.boxAreaRatio ?? null,
  faceOverlap: device?.faceOverlap ?? fallback.faceOverlap ?? null,
});

export const evaluateProctorSignals = (
  signals: VisionSignals,
  baseline: ProctorBaseline | null,
  sensitivity: ProctorSensitivity,
  context: ProctorDecisionContext = {},
): ProctorDecision[] => {
  const config = getProctorDecisionConfig(sensitivity);
  const exactlyOneFace = signals.faceCount === 1;
  const headDifferences = {
    yaw: baseline && signals.headYaw !== null ? signals.headYaw - baseline.headYaw : 0,
    pitch: baseline && signals.headPitch !== null ? signals.headPitch - baseline.headPitch : 0,
    roll: baseline && signals.headRoll !== null ? signals.headRoll - baseline.headRoll : 0,
  };
  const headRatios = {
    yaw: Math.abs(headDifferences.yaw) / config.headYawDelta,
    pitch: Math.abs(headDifferences.pitch) / config.headPitchDelta,
    roll: Math.abs(headDifferences.roll) / config.headRollDelta,
  };
  const headAxis = (Object.entries(headRatios) as Array<[keyof typeof headRatios, number]>)
    .sort((first, second) => second[1] - first[1])[0]![0];
  const allowedDownwardHeadMovement = context.roughPaperAllowed
    && headAxis === "pitch"
    && headDifferences.pitch > 0;
  const headMovementActive = Boolean(baseline && exactlyOneFace && headRatios[headAxis] >= 1 && !allowedDownwardHeadMovement);

  const eyeDifferences = {
    leftHorizontal: baseline && signals.leftEyeHorizontal !== null ? signals.leftEyeHorizontal - baseline.leftEyeHorizontal : 0,
    rightHorizontal: baseline && signals.rightEyeHorizontal !== null ? signals.rightEyeHorizontal - baseline.rightEyeHorizontal : 0,
    leftVertical: baseline && signals.leftEyeVertical !== null ? signals.leftEyeVertical - baseline.leftEyeVertical : 0,
    rightVertical: baseline && signals.rightEyeVertical !== null ? signals.rightEyeVertical - baseline.rightEyeVertical : 0,
  };
  const horizontalAgreement = Math.abs(eyeDifferences.leftHorizontal - eyeDifferences.rightHorizontal);
  const verticalAgreement = Math.abs(eyeDifferences.leftVertical - eyeDifferences.rightVertical);
  const horizontalMovement = Math.min(Math.abs(eyeDifferences.leftHorizontal), Math.abs(eyeDifferences.rightHorizontal));
  const verticalMovement = Math.min(Math.abs(eyeDifferences.leftVertical), Math.abs(eyeDifferences.rightVertical));
  const horizontalReliable = Math.sign(eyeDifferences.leftHorizontal) === Math.sign(eyeDifferences.rightHorizontal)
    && horizontalAgreement <= config.maxEyeDisagreement;
  const verticalReliable = Math.sign(eyeDifferences.leftVertical) === Math.sign(eyeDifferences.rightVertical)
    && verticalAgreement <= config.maxEyeDisagreement;
  const horizontalRatio = horizontalReliable ? horizontalMovement / config.eyeHorizontalDelta : 0;
  const verticalRatio = verticalReliable ? verticalMovement / config.eyeVerticalDelta : 0;
  const eyeAxis = horizontalRatio >= verticalRatio ? "horizontal" : "vertical";
  const eyeRatio = Math.max(horizontalRatio, verticalRatio);
  const eyeDifference = eyeAxis === "horizontal"
    ? (eyeDifferences.leftHorizontal + eyeDifferences.rightHorizontal) / 2
    : (eyeDifferences.leftVertical + eyeDifferences.rightVertical) / 2;
  const allowedDownwardEyeMovement = context.roughPaperAllowed
    && eyeAxis === "vertical"
    && eyeDifference > 0;
  const eyeMovementActive = Boolean(baseline && exactlyOneFace && !headMovementActive && eyeRatio >= 1 && !allowedDownwardEyeMovement);

  const phone = bestDevice(signals, "phone");
  const legacyPhoneConfidence = signals.phoneConfidence;
  const phoneConfidence = phone?.confidence ?? legacyPhoneConfidence ?? 0;
  const otherDevice = bestDevice(signals, "other");

  return [
    {
      type: "FACE_NOT_VISIBLE",
      label: "Face not visible",
      active: signals.faceCount === 0,
      thresholdMs: config.noFaceThreshold,
      confidence: signals.faceCount === 0 ? 0.99 : 0,
      metadata: { faceCount: signals.faceCount },
    },
    {
      type: "MULTIPLE_FACES",
      label: "Multiple faces",
      active: signals.faceCount > 1,
      thresholdMs: config.multipleThreshold,
      confidence: signals.faceCount > 1 ? 0.95 : 0,
      metadata: { faceCount: signals.faceCount },
    },
    {
      type: "HEAD_TURN_HORIZONTAL",
      label: "Head movement",
      active: headMovementActive,
      thresholdMs: config.headThreshold,
      confidence: headMovementActive ? Math.min(1, 0.55 + headRatios[headAxis] * 0.2) : 0,
      metadata: {
        axis: baseline && exactlyOneFace ? headAxis : null,
        direction: headMovementActive ? movementDirection(headAxis, headDifferences[headAxis]) : null,
        yawDifference: headDifferences.yaw,
        pitchDifference: headDifferences.pitch,
        rollDifference: headDifferences.roll,
      },
    },
    {
      type: "EYE_MOVEMENT_HORIZONTAL",
      label: "Eye movement",
      active: eyeMovementActive,
      thresholdMs: config.eyeThreshold,
      confidence: eyeMovementActive ? Math.min(1, 0.55 + eyeRatio * 0.2) : 0,
      metadata: {
        axis: baseline && exactlyOneFace ? eyeAxis : null,
        direction: eyeMovementActive ? gazeDirection(eyeAxis, eyeDifference) : null,
        horizontalMovement,
        verticalMovement,
        horizontalAgreement,
        verticalAgreement,
      },
    },
    {
      type: "PHONE_DETECTED",
      label: "Phone visible",
      active: phoneConfidence >= config.phoneConfidence,
      thresholdMs: config.phoneThreshold,
      confidence: phoneConfidence,
      metadata: deviceMetadata(phone, {
        category: legacyPhoneConfidence !== null ? "cell phone" : undefined,
        label: legacyPhoneConfidence !== null ? "Phone" : undefined,
        confidence: legacyPhoneConfidence ?? undefined,
        model: signals.phoneModel ?? undefined,
        boxAspectRatio: signals.phoneBoxAspectRatio ?? undefined,
        boxAreaRatio: signals.phoneBoxAreaRatio ?? undefined,
        faceOverlap: signals.phoneFaceOverlap ?? undefined,
      }),
    },
    {
      type: "DEVICE_DETECTED",
      label: otherDevice ? `${otherDevice.label} visible` : "Other device visible",
      active: Boolean(otherDevice && otherDevice.confidence >= config.deviceConfidence),
      thresholdMs: config.deviceThreshold,
      confidence: otherDevice?.confidence ?? 0,
      metadata: deviceMetadata(otherDevice),
    },
  ];
};

/**
 * Shared temporal runtime for the student exam and Admin Lab.
 * It turns frame-level candidates into sustained, grace-aware, cooldown-limited events.
 */
export class ProctorDecisionTracker {
  private clocks = new Map<ProctorSignalType, SignalClock>();
  private lastTimestamp: number | null = null;

  update(
    signals: VisionSignals,
    baseline: ProctorBaseline | null,
    sensitivity: ProctorSensitivity,
    nowMs: number,
    context: ProctorDecisionContext = {},
  ): TrackedProctorDecision[] {
    if (!Number.isFinite(nowMs)) throw new Error("A finite timestamp is required");
    if (this.lastTimestamp !== null && nowMs < this.lastTimestamp) this.reset();
    this.lastTimestamp = nowMs;
    const config = getProctorDecisionConfig(sensitivity);

    return evaluateProctorSignals(signals, baseline, sensitivity, context).map((decision) => {
      const clock = this.clocks.get(decision.type) ?? {
        startedAt: null,
        lastPositiveAt: null,
        lastEmittedAt: null,
        lastObservedActive: false,
      };
      if (decision.active) {
        const stalePositive = !clock.lastObservedActive
          && clock.lastPositiveAt !== null
          && nowMs - clock.lastPositiveAt > config.signalGrace;
        if (clock.startedAt === null || stalePositive) clock.startedAt = nowMs;
        clock.lastPositiveAt = nowMs;
        clock.lastObservedActive = true;
      } else if (clock.lastPositiveAt === null || nowMs - clock.lastPositiveAt > config.signalGrace) {
        clock.startedAt = null;
        clock.lastPositiveAt = null;
        clock.lastObservedActive = false;
      } else {
        clock.lastObservedActive = false;
      }

      const sustainedMs = clock.startedAt === null ? 0 : Math.max(0, nowMs - clock.startedAt);
      const thresholdReached = decision.active && sustainedMs >= decision.thresholdMs;
      const cooldownReady = clock.lastEmittedAt === null || nowMs - clock.lastEmittedAt >= config.cooldown;
      const triggered = thresholdReached && cooldownReady;
      if (triggered) clock.lastEmittedAt = nowMs;
      this.clocks.set(decision.type, clock);
      return { ...decision, sustainedMs, triggered };
    });
  }

  reset() {
    this.clocks.clear();
    this.lastTimestamp = null;
  }
}
