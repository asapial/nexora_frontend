import { describe, expect, test } from "vitest";
import {
  buildProctorBaseline,
  ProctorCalibrationBuffer,
} from "./calibration";
import {
  createEmptyVisionSignals,
  type VisionSignals,
} from "./vision";

const stableSignals = (overrides: Partial<VisionSignals> = {}): VisionSignals => ({
  ...createEmptyVisionSignals(),
  faceCount: 1,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  eyeHorizontal: 0.5,
  eyeVertical: 0.5,
  leftEyeHorizontal: 0.5,
  rightEyeHorizontal: 0.5,
  leftEyeVertical: 0.5,
  rightEyeVertical: 0.5,
  eyeAgreement: 0,
  eyeVerticalAgreement: 0,
  ...overrides,
});

const offsetSignals = (offset: number): VisionSignals => stableSignals({
  headYaw: offset,
  headPitch: offset,
  headRoll: offset,
  eyeHorizontal: 0.5 + offset,
  eyeVertical: 0.5 + offset,
  leftEyeHorizontal: 0.5 + offset,
  rightEyeHorizontal: 0.5 + offset,
  leftEyeVertical: 0.5 + offset,
  rightEyeVertical: 0.5 + offset,
});

describe("buildProctorBaseline", () => {
  test("requires the requested number of complete, exactly-one-face samples", () => {
    const result = buildProctorBaseline([
      stableSignals(),
      stableSignals({ faceCount: 0 }),
      stableSignals({ faceCount: 2 }),
      stableSignals({ headPitch: null }),
      stableSignals({ leftEyeVertical: Number.NaN }),
    ], 2);

    expect(result).toEqual({
      ok: false,
      reason: "Hold still with exactly one face visible for another moment (1/2 stable frames).",
      sampleCount: 1,
    });
  });

  test("uses a rolling median so a single extreme frame cannot move the baseline", () => {
    const result = buildProctorBaseline([
      ...Array.from({ length: 10 }, () => stableSignals()),
      offsetSignals(4),
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sampleCount).toBe(11);
    expect(result.baseline).toEqual({
      headYaw: 0,
      headPitch: 0,
      headRoll: 0,
      eyeHorizontal: 0.5,
      eyeVertical: 0.5,
      leftEyeHorizontal: 0.5,
      rightEyeHorizontal: 0.5,
      leftEyeVertical: 0.5,
      rightEyeVertical: 0.5,
    });
    expect(result.stability).toBe(1);
  });

  test("accepts a small stable spread and reports its median and stability", () => {
    const samples = Array.from({ length: 10 }, (_, index) => offsetSignals(index % 2 ? 0.01 : -0.01));
    const result = buildProctorBaseline(samples);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.baseline.headYaw).toBeCloseTo(0);
    expect(result.baseline.eyeHorizontal).toBeCloseTo(0.5);
    expect(result.stability).toBeGreaterThan(0.8);
    expect(result.stability).toBeLessThan(1);
  });

  test("rejects a window with excessive head noise", () => {
    const samples = Array.from({ length: 10 }, (_, index) => stableSignals({
      headYaw: index < 5 ? -0.1 : 0.1,
    }));
    const result = buildProctorBaseline(samples);

    expect(result).toEqual({
      ok: false,
      reason: "The neutral sample was too unsteady. Face the screen, keep your head still, and try again.",
      sampleCount: 10,
    });
  });

  test("rejects a window with excessive bilateral eye noise", () => {
    const samples = Array.from({ length: 10 }, (_, index) => {
      const eye = index < 5 ? 0.4 : 0.6;
      return stableSignals({
        eyeHorizontal: eye,
        leftEyeHorizontal: eye,
        rightEyeHorizontal: eye,
      });
    });
    const result = buildProctorBaseline(samples);

    expect(result.ok).toBe(false);
    expect(result.sampleCount).toBe(10);
    if (!result.ok) expect(result.reason).toContain("too unsteady");
  });
});

describe("ProctorCalibrationBuffer", () => {
  test("keeps only the newest samples in its rolling window", () => {
    const buffer = new ProctorCalibrationBuffer(3);
    [-0.02, -0.01, 0, 0.01].forEach((offset) => buffer.push(offsetSignals(offset)));

    expect(buffer.sampleCount).toBe(3);
    const result = buffer.createBaseline(3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.baseline.headYaw).toBeCloseTo(0);
      expect(result.baseline.eyeHorizontal).toBeCloseTo(0.5);
    }
  });

  test("ignores an incomplete one-face frame but clears the window when face count is invalid", () => {
    const buffer = new ProctorCalibrationBuffer();
    buffer.push(stableSignals());
    buffer.push(stableSignals({ headRoll: null }));
    expect(buffer.sampleCount).toBe(1);

    buffer.push(stableSignals({ faceCount: 0 }));
    expect(buffer.sampleCount).toBe(0);
    buffer.push(stableSignals());
    buffer.push(stableSignals({ faceCount: 2 }));
    expect(buffer.sampleCount).toBe(0);
  });

  test("reset removes every collected sample", () => {
    const buffer = new ProctorCalibrationBuffer();
    buffer.push(stableSignals());
    buffer.push(stableSignals());
    expect(buffer.sampleCount).toBe(2);

    buffer.reset();

    expect(buffer.sampleCount).toBe(0);
    expect(buffer.createBaseline(1).ok).toBe(false);
  });
});
