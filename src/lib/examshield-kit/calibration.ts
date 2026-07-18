import type { ProctorBaseline } from "./decision";
import type { VisionSignals } from "./vision";

const HEAD_BASELINE_FIELDS = [
  "headYaw",
  "headPitch",
  "headRoll",
] as const satisfies ReadonlyArray<keyof ProctorBaseline>;

const EYE_BASELINE_FIELDS = [
  "eyeHorizontal",
  "eyeVertical",
  "leftEyeHorizontal",
  "rightEyeHorizontal",
  "leftEyeVertical",
  "rightEyeVertical",
] as const satisfies ReadonlyArray<keyof ProctorBaseline>;

type HeadBaselineField = typeof HEAD_BASELINE_FIELDS[number];
type EyeBaselineField = typeof EYE_BASELINE_FIELDS[number];
type HeadCalibrationSample = Record<HeadBaselineField, number>;
type EyeCalibrationSample = Record<EyeBaselineField, number>;

export type CalibrationResult =
  | {
    ok: true;
    baseline: ProctorBaseline;
    sampleCount: number;
    eyeSampleCount: number;
    eyeTrackingAvailable: boolean;
    stability: number;
  }
  | { ok: false; reason: string; sampleCount: number };

const median = (values: number[]) => {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};

const medianAbsoluteDeviation = (values: number[], center: number) =>
  median(values.map((value) => Math.abs(value - center)));

const toSample = <Field extends HeadBaselineField | EyeBaselineField>(
  signals: VisionSignals,
  fields: readonly Field[],
): Record<Field, number> | null => {
  if (signals.faceCount !== 1) return null;
  const entries = fields.map((field) => [field, signals[field]] as const);
  if (entries.some(([, value]) => value === null || !Number.isFinite(value))) return null;
  return Object.fromEntries(entries) as Record<Field, number>;
};

const toHeadCalibrationSample = (signals: VisionSignals) => toSample(signals, HEAD_BASELINE_FIELDS);
const toEyeCalibrationSample = (signals: VisionSignals) => toSample(signals, EYE_BASELINE_FIELDS);

const neutralEyeBaseline: Record<EyeBaselineField, number> = {
  eyeHorizontal: 0.5,
  eyeVertical: 0.5,
  leftEyeHorizontal: 0.5,
  rightEyeHorizontal: 0.5,
  leftEyeVertical: 0.5,
  rightEyeVertical: 0.5,
};

/** Builds a robust neutral baseline from a short rolling window instead of one noisy frame. */
export const buildProctorBaseline = (
  signals: VisionSignals[],
  minimumSamples = 10,
): CalibrationResult => {
  const headSamples = signals
    .map(toHeadCalibrationSample)
    .filter((sample): sample is HeadCalibrationSample => sample !== null);
  if (headSamples.length < minimumSamples) {
    return {
      ok: false,
      reason: `Hold still with exactly one face visible for another moment (${headSamples.length}/${minimumSamples} stable frames).`,
      sampleCount: headSamples.length,
    };
  }

  const headBaseline = Object.fromEntries(HEAD_BASELINE_FIELDS.map((field) => [
    field,
    median(headSamples.map((sample) => sample[field])),
  ])) as HeadCalibrationSample;
  const headDeviations = Object.fromEntries(HEAD_BASELINE_FIELDS.map((field) => [
    field,
    medianAbsoluteDeviation(headSamples.map((sample) => sample[field]), headBaseline[field]),
  ])) as HeadCalibrationSample;
  const headNoise = Math.max(headDeviations.headYaw, headDeviations.headPitch, headDeviations.headRoll);
  if (headNoise > 0.055) {
    return {
      ok: false,
      reason: "The neutral sample was too unsteady. Face the screen, keep your head still, and try again.",
      sampleCount: headSamples.length,
    };
  }

  const eyeSamples = signals
    .map(toEyeCalibrationSample)
    .filter((sample): sample is EyeCalibrationSample => sample !== null);
  const eyeBaseline = eyeSamples.length > 0
    ? Object.fromEntries(EYE_BASELINE_FIELDS.map((field) => [
      field,
      median(eyeSamples.map((sample) => sample[field])),
    ])) as EyeCalibrationSample
    : neutralEyeBaseline;
  const eyeDeviations = eyeSamples.length > 0
    ? Object.fromEntries(EYE_BASELINE_FIELDS.map((field) => [
      field,
      medianAbsoluteDeviation(eyeSamples.map((sample) => sample[field]), eyeBaseline[field]),
    ])) as EyeCalibrationSample
    : null;
  const eyeNoise = eyeDeviations
    ? Math.max(
      eyeDeviations.leftEyeHorizontal,
      eyeDeviations.rightEyeHorizontal,
      eyeDeviations.leftEyeVertical,
      eyeDeviations.rightEyeVertical,
    )
    : Number.POSITIVE_INFINITY;
  const requiredEyeSamples = Math.max(minimumSamples, Math.ceil(headSamples.length * 0.7));
  const eyeTrackingAvailable = eyeSamples.length >= requiredEyeSamples && eyeNoise <= 0.075;
  const baseline: ProctorBaseline = {
    ...headBaseline,
    ...eyeBaseline,
    eyeTrackingAvailable,
  };
  const headStability = 1 - headNoise / 0.055;
  const stability = Math.max(0, Math.min(1, eyeTrackingAvailable
    ? (headStability + (1 - eyeNoise / 0.075)) / 2
    : headStability));
  return {
    ok: true,
    baseline,
    sampleCount: headSamples.length,
    eyeSampleCount: eyeSamples.length,
    eyeTrackingAvailable,
    stability,
  };
};

export class ProctorCalibrationBuffer {
  private samples: VisionSignals[] = [];

  constructor(private readonly maximumSamples = 36) {}

  push(signals: VisionSignals) {
    if (toHeadCalibrationSample(signals)) {
      this.samples.push(signals);
      if (this.samples.length > this.maximumSamples) this.samples.shift();
    } else if (signals.faceCount !== 1) {
      this.samples = [];
    }
  }

  createBaseline(minimumSamples = 10) {
    return buildProctorBaseline(this.samples, minimumSamples);
  }

  reset() {
    this.samples = [];
  }

  get sampleCount() {
    return this.samples.length;
  }
}
