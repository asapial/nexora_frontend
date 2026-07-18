import type { ProctorBaseline } from "./decision";
import type { VisionSignals } from "./vision";

const BASELINE_FIELDS = [
  "headYaw",
  "headPitch",
  "headRoll",
  "eyeHorizontal",
  "eyeVertical",
  "leftEyeHorizontal",
  "rightEyeHorizontal",
  "leftEyeVertical",
  "rightEyeVertical",
] as const satisfies ReadonlyArray<keyof ProctorBaseline>;

type BaselineField = typeof BASELINE_FIELDS[number];
type CalibrationSample = Record<BaselineField, number>;

export type CalibrationResult =
  | { ok: true; baseline: ProctorBaseline; sampleCount: number; stability: number }
  | { ok: false; reason: string; sampleCount: number };

const median = (values: number[]) => {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};

const medianAbsoluteDeviation = (values: number[], center: number) =>
  median(values.map((value) => Math.abs(value - center)));

const toCalibrationSample = (signals: VisionSignals): CalibrationSample | null => {
  if (signals.faceCount !== 1) return null;
  const entries = BASELINE_FIELDS.map((field) => [field, signals[field]] as const);
  if (entries.some(([, value]) => value === null || !Number.isFinite(value))) return null;
  return Object.fromEntries(entries) as CalibrationSample;
};

/** Builds a robust neutral baseline from a short rolling window instead of one noisy frame. */
export const buildProctorBaseline = (
  signals: VisionSignals[],
  minimumSamples = 10,
): CalibrationResult => {
  const samples = signals.map(toCalibrationSample).filter((sample): sample is CalibrationSample => sample !== null);
  if (samples.length < minimumSamples) {
    return {
      ok: false,
      reason: `Hold still with exactly one face visible for another moment (${samples.length}/${minimumSamples} stable frames).`,
      sampleCount: samples.length,
    };
  }

  const baseline = Object.fromEntries(BASELINE_FIELDS.map((field) => [
    field,
    median(samples.map((sample) => sample[field])),
  ])) as ProctorBaseline;
  const deviations = Object.fromEntries(BASELINE_FIELDS.map((field) => [
    field,
    medianAbsoluteDeviation(samples.map((sample) => sample[field]), baseline[field]),
  ])) as Record<BaselineField, number>;
  const headNoise = Math.max(deviations.headYaw, deviations.headPitch, deviations.headRoll);
  const eyeNoise = Math.max(
    deviations.leftEyeHorizontal,
    deviations.rightEyeHorizontal,
    deviations.leftEyeVertical,
    deviations.rightEyeVertical,
  );
  if (headNoise > 0.055 || eyeNoise > 0.075) {
    return {
      ok: false,
      reason: "The neutral sample was too unsteady. Face the screen, keep your head still, and try again.",
      sampleCount: samples.length,
    };
  }

  const stability = Math.max(0, Math.min(1, 1 - (headNoise / 0.055 + eyeNoise / 0.075) / 2));
  return { ok: true, baseline, sampleCount: samples.length, stability };
};

export class ProctorCalibrationBuffer {
  private samples: VisionSignals[] = [];

  constructor(private readonly maximumSamples = 36) {}

  push(signals: VisionSignals) {
    if (toCalibrationSample(signals)) {
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
