import type { ProctorSensitivity } from "@/lib/examShield";
import type { VisionSignals } from "./vision";

export type ProctorBaseline = {
  headYaw: number;
  eyeHorizontal: number;
  leftEyeHorizontal: number;
  rightEyeHorizontal: number;
};

export type ProctorSignalType =
  | "FACE_NOT_VISIBLE"
  | "MULTIPLE_FACES"
  | "HEAD_TURN_HORIZONTAL"
  | "EYE_MOVEMENT_HORIZONTAL"
  | "PHONE_DETECTED";

export type ProctorDecision = {
  type: ProctorSignalType;
  label: string;
  active: boolean;
  thresholdMs: number;
  confidence: number;
  metadata: Record<string, unknown>;
};

export const getProctorDecisionConfig = (sensitivity: ProctorSensitivity) => ({
  noFaceThreshold: sensitivity === "RELAXED" ? 5000 : sensitivity === "STRICT" ? 2000 : 3000,
  multipleThreshold: sensitivity === "RELAXED" ? 2500 : sensitivity === "STRICT" ? 1000 : 1500,
  headThreshold: sensitivity === "RELAXED" ? 1800 : sensitivity === "STRICT" ? 700 : 1100,
  eyeThreshold: sensitivity === "RELAXED" ? 2200 : sensitivity === "STRICT" ? 1000 : 1500,
  phoneThreshold: sensitivity === "RELAXED" ? 1600 : sensitivity === "STRICT" ? 600 : 1000,
  headDelta: sensitivity === "RELAXED" ? 0.16 : sensitivity === "STRICT" ? 0.08 : 0.11,
  eyeDelta: sensitivity === "RELAXED" ? 0.07 : sensitivity === "STRICT" ? 0.035 : 0.05,
  maxEyeDisagreement: sensitivity === "STRICT" ? 0.16 : 0.13,
  phoneConfidence: sensitivity === "RELAXED" ? 0.5 : sensitivity === "STRICT" ? 0.34 : 0.42,
  cooldown: sensitivity === "RELAXED" ? 30000 : sensitivity === "STRICT" ? 15000 : 20000,
  signalGrace: sensitivity === "STRICT" ? 900 : 1400,
});

export const evaluateProctorSignals = (
  signals: VisionSignals,
  baseline: ProctorBaseline | null,
  sensitivity: ProctorSensitivity,
): ProctorDecision[] => {
  const config = getProctorDecisionConfig(sensitivity);
  const yawDifference = baseline && signals.headYaw !== null ? Math.abs(signals.headYaw - baseline.headYaw) : 0;
  const eyeDifference = baseline && signals.eyeHorizontal !== null ? Math.abs(signals.eyeHorizontal - baseline.eyeHorizontal) : 0;
  const leftEyeDifference = baseline && signals.leftEyeHorizontal !== null ? signals.leftEyeHorizontal - baseline.leftEyeHorizontal : 0;
  const rightEyeDifference = baseline && signals.rightEyeHorizontal !== null ? signals.rightEyeHorizontal - baseline.rightEyeHorizontal : 0;
  const eyesAgreeOnDirection = Math.sign(leftEyeDifference) === Math.sign(rightEyeDifference);
  const bilateralEyeMovement = Math.abs(leftEyeDifference) >= config.eyeDelta && Math.abs(rightEyeDifference) >= config.eyeDelta;
  const movementAgreement = Math.abs(leftEyeDifference - rightEyeDifference);
  const gazeReliable = movementAgreement <= config.maxEyeDisagreement;

  return [
    {
      type: "FACE_NOT_VISIBLE",
      label: "Face not visible",
      active: signals.faceCount === 0,
      thresholdMs: config.noFaceThreshold,
      confidence: 0.9,
      metadata: { faceCount: signals.faceCount },
    },
    {
      type: "MULTIPLE_FACES",
      label: "Multiple faces",
      active: signals.faceCount > 1,
      thresholdMs: config.multipleThreshold,
      confidence: 0.9,
      metadata: { faceCount: signals.faceCount },
    },
    {
      type: "HEAD_TURN_HORIZONTAL",
      label: "Horizontal head turn",
      active: Boolean(baseline && yawDifference >= config.headDelta),
      thresholdMs: config.headThreshold,
      confidence: Math.min(1, 0.65 + yawDifference),
      metadata: {
        yawDifference,
        direction: signals.headYaw! > (baseline?.headYaw ?? 0) ? "right" : "left",
      },
    },
    {
      type: "EYE_MOVEMENT_HORIZONTAL",
      label: "Horizontal eye movement",
      active: Boolean(baseline && bilateralEyeMovement && eyesAgreeOnDirection && gazeReliable && yawDifference < config.headDelta),
      thresholdMs: config.eyeThreshold,
      confidence: Math.min(1, 0.6 + eyeDifference),
      metadata: {
        eyeDifference,
        leftEyeDifference,
        rightEyeDifference,
        eyeAgreement: signals.eyeAgreement,
        movementAgreement,
        direction: signals.eyeHorizontal! > (baseline?.eyeHorizontal ?? 0) ? "right" : "left",
      },
    },
    {
      type: "PHONE_DETECTED",
      label: "Visible phone",
      active: Boolean(signals.phoneConfidence !== null && signals.phoneConfidence >= config.phoneConfidence),
      thresholdMs: config.phoneThreshold,
      confidence: signals.phoneConfidence ?? 0,
      metadata: {
        category: "cell phone",
        model: signals.phoneModel,
        phoneConfidence: signals.phoneConfidence,
        boxAspectRatio: signals.phoneBoxAspectRatio,
        boxAreaRatio: signals.phoneBoxAreaRatio,
        faceOverlap: signals.phoneFaceOverlap,
      },
    },
  ];
};
