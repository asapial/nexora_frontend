import { describe, expect, it } from "vitest";

import {
  ProctorDecisionTracker,
  evaluateProctorSignals,
  getProctorDecisionConfig,
  type ProctorBaseline,
  type ProctorDecision,
  type ProctorSignalType,
  type TrackedProctorDecision,
} from "./decision";
import {
  createEmptyVisionSignals,
  type VisionDeviceCategory,
  type VisionDeviceDetection,
  type VisionSignals,
} from "./vision";

type Sensitivity = "STRICT" | "STANDARD" | "RELAXED";

const BASELINE: ProctorBaseline = {
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  eyeHorizontal: 0.5,
  eyeVertical: 0.5,
  leftEyeHorizontal: 0.5,
  rightEyeHorizontal: 0.5,
  leftEyeVertical: 0.5,
  rightEyeVertical: 0.5,
};

const ZERO_BASELINE: ProctorBaseline = {
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  eyeHorizontal: 0,
  eyeVertical: 0,
  leftEyeHorizontal: 0,
  rightEyeHorizontal: 0,
  leftEyeVertical: 0,
  rightEyeVertical: 0,
};

const signalsAtBaseline = (
  baseline: ProctorBaseline = BASELINE,
  overrides: Partial<VisionSignals> = {},
): VisionSignals => ({
  ...createEmptyVisionSignals(),
  faceCount: 1,
  headYaw: baseline.headYaw,
  headPitch: baseline.headPitch,
  headRoll: baseline.headRoll,
  eyeHorizontal: baseline.eyeHorizontal,
  eyeVertical: baseline.eyeVertical,
  leftEyeHorizontal: baseline.leftEyeHorizontal,
  rightEyeHorizontal: baseline.rightEyeHorizontal,
  leftEyeVertical: baseline.leftEyeVertical,
  rightEyeVertical: baseline.rightEyeVertical,
  ...overrides,
});

const deviceLabels: Record<VisionDeviceCategory, string> = {
  "cell phone": "Phone",
  laptop: "Laptop",
  tablet: "Tablet",
  remote: "Remote device",
};

const makeDevice = (
  category: VisionDeviceCategory,
  confidence: number,
  overrides: Partial<VisionDeviceDetection> = {},
): VisionDeviceDetection => ({
  category,
  label: deviceLabels[category],
  confidence,
  boxAspectRatio: 0.5,
  boxAreaRatio: 0.08,
  faceOverlap: 0.1,
  eyeBandOverlap: 0,
  confirmationFrames: 2,
  spectacleRisk: false,
  box: { x: 0.1, y: 0.2, width: 0.2, height: 0.4 },
  model: "fixture-model",
  ...overrides,
});

const decisionOf = <T extends ProctorDecision | TrackedProctorDecision>(
  decisions: T[],
  type: ProctorSignalType,
): T => {
  const decision = decisions.find((candidate) => candidate.type === type);
  if (!decision) throw new Error(`Missing ${type} decision`);
  return decision;
};

const evaluate = (
  signals: VisionSignals,
  sensitivity: Sensitivity = "STANDARD",
  baseline: ProctorBaseline | null = BASELINE,
) => evaluateProctorSignals(signals, baseline, sensitivity);

const updateDecision = (
  tracker: ProctorDecisionTracker,
  type: ProctorSignalType,
  signals: VisionSignals,
  nowMs: number,
  sensitivity: Sensitivity = "STANDARD",
) => decisionOf(tracker.update(signals, BASELINE, sensitivity, nowMs), type);

const sensitivityCases = [
  {
    sensitivity: "STRICT" as const,
    expected: {
      noFaceThreshold: 1400,
      multipleThreshold: 700,
      headThreshold: 500,
      eyeThreshold: 700,
      phoneThreshold: 350,
      deviceThreshold: 500,
      headYawDelta: 0.075,
      headPitchDelta: 0.07,
      headRollDelta: 0.065,
      eyeHorizontalDelta: 0.035,
      eyeVerticalDelta: 0.045,
      maxEyeDisagreement: 0.1,
      phoneConfidence: 0.32,
      deviceConfidence: 0.4,
      cooldown: 15000,
      signalGrace: 500,
    },
  },
  {
    sensitivity: "STANDARD" as const,
    expected: {
      noFaceThreshold: 2400,
      multipleThreshold: 1200,
      headThreshold: 800,
      eyeThreshold: 1000,
      phoneThreshold: 650,
      deviceThreshold: 850,
      headYawDelta: 0.11,
      headPitchDelta: 0.1,
      headRollDelta: 0.095,
      eyeHorizontalDelta: 0.05,
      eyeVerticalDelta: 0.065,
      maxEyeDisagreement: 0.13,
      phoneConfidence: 0.42,
      deviceConfidence: 0.5,
      cooldown: 20000,
      signalGrace: 750,
    },
  },
  {
    sensitivity: "RELAXED" as const,
    expected: {
      noFaceThreshold: 4000,
      multipleThreshold: 2000,
      headThreshold: 1400,
      eyeThreshold: 1800,
      phoneThreshold: 1100,
      deviceThreshold: 1400,
      headYawDelta: 0.16,
      headPitchDelta: 0.15,
      headRollDelta: 0.14,
      eyeHorizontalDelta: 0.075,
      eyeVerticalDelta: 0.09,
      maxEyeDisagreement: 0.16,
      phoneConfidence: 0.52,
      deviceConfidence: 0.6,
      cooldown: 30000,
      signalGrace: 1000,
    },
  },
];

describe("evaluateProctorSignals", () => {
  it("returns all six decisions and makes the face-count states mutually exclusive", () => {
    const noFace = evaluate(signalsAtBaseline(BASELINE, { faceCount: 0 }));

    expect(noFace.map(({ type }) => type)).toEqual([
      "FACE_NOT_VISIBLE",
      "MULTIPLE_FACES",
      "HEAD_TURN_HORIZONTAL",
      "EYE_MOVEMENT_HORIZONTAL",
      "PHONE_DETECTED",
      "DEVICE_DETECTED",
    ]);
    expect(noFace.filter(({ active }) => active).map(({ type }) => type)).toEqual(["FACE_NOT_VISIBLE"]);
    expect(decisionOf(noFace, "FACE_NOT_VISIBLE")).toMatchObject({
      confidence: 0.99,
      metadata: { faceCount: 0 },
    });

    const multipleFaces = evaluate(signalsAtBaseline(BASELINE, { faceCount: 2 }));
    expect(multipleFaces.filter(({ active }) => active).map(({ type }) => type)).toEqual(["MULTIPLE_FACES"]);
    expect(decisionOf(multipleFaces, "MULTIPLE_FACES")).toMatchObject({
      confidence: 0.95,
      metadata: { faceCount: 2 },
    });
  });

  it.each([0, 2])("gates head and eye movement unless exactly one face is present (faceCount=%i)", (faceCount) => {
    const headDecision = decisionOf(
      evaluate(signalsAtBaseline(BASELINE, { faceCount, headYaw: 0.3 })),
      "HEAD_TURN_HORIZONTAL",
    );
    const eyeDecision = decisionOf(
      evaluate(signalsAtBaseline(BASELINE, {
        faceCount,
        eyeHorizontal: 0.6,
        leftEyeHorizontal: 0.6,
        rightEyeHorizontal: 0.6,
      })),
      "EYE_MOVEMENT_HORIZONTAL",
    );

    expect(headDecision.active).toBe(false);
    expect(eyeDecision.active).toBe(false);
  });

  it("requires a baseline for movement decisions", () => {
    const signals = signalsAtBaseline(BASELINE, {
      headYaw: 0.3,
      eyeHorizontal: 0.7,
      leftEyeHorizontal: 0.7,
      rightEyeHorizontal: 0.7,
    });
    const decisions = evaluate(signals, "STANDARD", null);

    expect(decisionOf(decisions, "HEAD_TURN_HORIZONTAL").active).toBe(false);
    expect(decisionOf(decisions, "EYE_MOVEMENT_HORIZONTAL").active).toBe(false);
  });

  it.each([
    { axis: "yaw", overrides: { headYaw: 0.12 }, direction: "right", difference: 0.12 },
    { axis: "pitch", overrides: { headPitch: -0.11 }, direction: "up", difference: -0.11 },
    { axis: "roll", overrides: { headRoll: 0.105 }, direction: "right", difference: 0.105 },
  ] as const)("detects dominant $axis head movement", ({ axis, overrides, direction, difference }) => {
    const decision = decisionOf(
      evaluate(signalsAtBaseline(BASELINE, overrides)),
      "HEAD_TURN_HORIZONTAL",
    );

    expect(decision.active).toBe(true);
    expect(decision.metadata).toMatchObject({ axis, direction });
    expect(decision.metadata[`${axis}Difference`]).toBeCloseTo(difference);
  });

  it.each([
    {
      axis: "horizontal",
      overrides: {
        eyeHorizontal: 0.56,
        leftEyeHorizontal: 0.56,
        rightEyeHorizontal: 0.56,
      },
      direction: "right",
    },
    {
      axis: "vertical",
      overrides: {
        eyeVertical: 0.43,
        leftEyeVertical: 0.43,
        rightEyeVertical: 0.43,
      },
      direction: "up",
    },
  ] as const)("detects reliable $axis gaze movement", ({ axis, overrides, direction }) => {
    const decision = decisionOf(
      evaluate(signalsAtBaseline(BASELINE, overrides)),
      "EYE_MOVEMENT_HORIZONTAL",
    );

    expect(decision.active).toBe(true);
    expect(decision.metadata).toMatchObject({ axis, direction });
  });

  it("suppresses eye warnings for a head-only spectacles calibration while preserving head detection", () => {
    const headOnlyBaseline: ProctorBaseline = { ...BASELINE, eyeTrackingAvailable: false };
    const decisions = evaluate(
      signalsAtBaseline(headOnlyBaseline, {
        headYaw: 0.12,
        eyeHorizontal: 0.65,
        leftEyeHorizontal: 0.65,
        rightEyeHorizontal: 0.65,
      }),
      "STANDARD",
      headOnlyBaseline,
    );

    expect(decisionOf(decisions, "HEAD_TURN_HORIZONTAL").active).toBe(true);
    expect(decisionOf(decisions, "EYE_MOVEMENT_HORIZONTAL")).toMatchObject({
      active: false,
      metadata: { eyeTrackingAvailable: false, eyeLandmarksReliable: true },
    });
  });

  it("reports unavailable live iris landmarks without creating an eye warning", () => {
    const decision = decisionOf(
      evaluate(signalsAtBaseline(BASELINE, {
        eyeHorizontal: null,
        eyeVertical: null,
        leftEyeHorizontal: null,
        rightEyeHorizontal: null,
        leftEyeVertical: null,
        rightEyeVertical: null,
      })),
      "EYE_MOVEMENT_HORIZONTAL",
    );

    expect(decision).toMatchObject({
      active: false,
      metadata: { eyeTrackingAvailable: true, eyeLandmarksReliable: false },
    });
  });

  it("rejects disagreeing gaze and suppresses gaze while head movement is active", () => {
    const disagreeing = decisionOf(
      evaluate(signalsAtBaseline(BASELINE, {
        leftEyeHorizontal: 0.58,
        rightEyeHorizontal: 0.42,
      })),
      "EYE_MOVEMENT_HORIZONTAL",
    );
    const withHeadMovement = decisionOf(
      evaluate(signalsAtBaseline(BASELINE, {
        headPitch: 0.2,
        leftEyeVertical: 0.6,
        rightEyeVertical: 0.6,
      })),
      "EYE_MOVEMENT_HORIZONTAL",
    );

    expect(disagreeing.active).toBe(false);
    expect(withHeadMovement.active).toBe(false);
  });

  it("allows downward rough-work movement without suppressing horizontal movement", () => {
    const downward = evaluateProctorSignals(
      signalsAtBaseline(BASELINE, {
        headPitch: 0.2,
        eyeVertical: 0.62,
        leftEyeVertical: 0.62,
        rightEyeVertical: 0.62,
      }),
      BASELINE,
      "STANDARD",
      { roughPaperAllowed: true },
    );
    const horizontal = evaluateProctorSignals(
      signalsAtBaseline(BASELINE, { headYaw: 0.2 }),
      BASELINE,
      "STANDARD",
      { roughPaperAllowed: true },
    );

    expect(decisionOf(downward, "HEAD_TURN_HORIZONTAL").active).toBe(false);
    expect(decisionOf(downward, "EYE_MOVEMENT_HORIZONTAL").active).toBe(false);
    expect(decisionOf(horizontal, "HEAD_TURN_HORIZONTAL").active).toBe(true);
  });

  it("uses the highest-confidence phone and non-phone device independently", () => {
    const decisions = evaluate(signalsAtBaseline(BASELINE, {
      detectedDevices: [
        makeDevice("cell phone", 0.43, { model: "phone-low" }),
        makeDevice("tablet", 0.61, { model: "tablet-model" }),
        makeDevice("cell phone", 0.81, {
          model: "phone-high",
          confirmationFrames: 4,
          spectacleRisk: true,
          eyeBandOverlap: 0.92,
        }),
        makeDevice("laptop", 0.78, { model: "laptop-model" }),
      ],
    }));
    const phone = decisionOf(decisions, "PHONE_DETECTED");
    const otherDevice = decisionOf(decisions, "DEVICE_DETECTED");

    expect(phone).toMatchObject({
      active: true,
      confidence: 0.81,
      metadata: {
        category: "cell phone",
        model: "phone-high",
        confirmationFrames: 4,
        spectacleRisk: true,
        eyeBandOverlap: 0.92,
      },
    });
    expect(otherDevice).toMatchObject({
      active: true,
      label: "Laptop visible",
      confidence: 0.78,
      metadata: { category: "laptop", model: "laptop-model" },
    });
  });

  it("supports legacy phone confidence and metadata when no device object exists", () => {
    const phone = decisionOf(
      evaluate(signalsAtBaseline(BASELINE, {
        phoneConfidence: 0.42,
        phoneModel: "legacy-model",
        phoneBoxAspectRatio: 0.45,
        phoneBoxAreaRatio: 0.04,
        phoneFaceOverlap: 0.2,
      })),
      "PHONE_DETECTED",
    );

    expect(phone).toMatchObject({
      active: true,
      confidence: 0.42,
      metadata: {
        category: "cell phone",
        label: "Phone",
        model: "legacy-model",
        confidence: 0.42,
        boxAspectRatio: 0.45,
        boxAreaRatio: 0.04,
        faceOverlap: 0.2,
      },
    });
  });

  it.each(sensitivityCases)(
    "uses inclusive frame-level boundaries for $sensitivity sensitivity",
    ({ sensitivity, expected }) => {
      expect(getProctorDecisionConfig(sensitivity)).toEqual(expected);

      const exactHead = decisionOf(
        evaluate(
          signalsAtBaseline(ZERO_BASELINE, { headYaw: expected.headYawDelta }),
          sensitivity,
          ZERO_BASELINE,
        ),
        "HEAD_TURN_HORIZONTAL",
      );
      const belowHead = decisionOf(
        evaluate(
          signalsAtBaseline(ZERO_BASELINE, { headYaw: expected.headYawDelta - 0.000001 }),
          sensitivity,
          ZERO_BASELINE,
        ),
        "HEAD_TURN_HORIZONTAL",
      );
      const exactEye = decisionOf(
        evaluate(
          signalsAtBaseline(ZERO_BASELINE, {
            eyeHorizontal: expected.eyeHorizontalDelta,
            leftEyeHorizontal: expected.eyeHorizontalDelta,
            rightEyeHorizontal: expected.eyeHorizontalDelta,
          }),
          sensitivity,
          ZERO_BASELINE,
        ),
        "EYE_MOVEMENT_HORIZONTAL",
      );
      const belowEye = decisionOf(
        evaluate(
          signalsAtBaseline(ZERO_BASELINE, {
            eyeHorizontal: expected.eyeHorizontalDelta - 0.000001,
            leftEyeHorizontal: expected.eyeHorizontalDelta - 0.000001,
            rightEyeHorizontal: expected.eyeHorizontalDelta - 0.000001,
          }),
          sensitivity,
          ZERO_BASELINE,
        ),
        "EYE_MOVEMENT_HORIZONTAL",
      );
      const exactPhone = decisionOf(
        evaluate(signalsAtBaseline(BASELINE, { phoneConfidence: expected.phoneConfidence }), sensitivity),
        "PHONE_DETECTED",
      );
      const belowPhone = decisionOf(
        evaluate(signalsAtBaseline(BASELINE, { phoneConfidence: expected.phoneConfidence - 0.000001 }), sensitivity),
        "PHONE_DETECTED",
      );
      const exactDevice = decisionOf(
        evaluate(signalsAtBaseline(BASELINE, {
          detectedDevices: [makeDevice("tablet", expected.deviceConfidence)],
        }), sensitivity),
        "DEVICE_DETECTED",
      );
      const belowDevice = decisionOf(
        evaluate(signalsAtBaseline(BASELINE, {
          detectedDevices: [makeDevice("tablet", expected.deviceConfidence - 0.000001)],
        }), sensitivity),
        "DEVICE_DETECTED",
      );

      expect(exactHead.active).toBe(true);
      expect(belowHead.active).toBe(false);
      expect(exactEye.active).toBe(true);
      expect(belowEye.active).toBe(false);
      expect(exactPhone.active).toBe(true);
      expect(belowPhone.active).toBe(false);
      expect(exactDevice.active).toBe(true);
      expect(belowDevice.active).toBe(false);
    },
  );
});

describe("ProctorDecisionTracker", () => {
  it.each(sensitivityCases)(
    "counts from timestamp zero and triggers at the exact $sensitivity threshold",
    ({ sensitivity, expected }) => {
      const tracker = new ProctorDecisionTracker();
      const noFace = signalsAtBaseline(BASELINE, { faceCount: 0 });

      expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 0, sensitivity)).toMatchObject({
        sustainedMs: 0,
        triggered: false,
      });
      expect(
        updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, expected.noFaceThreshold - 1, sensitivity),
      ).toMatchObject({
        sustainedMs: expected.noFaceThreshold - 1,
        triggered: false,
      });
      expect(
        updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, expected.noFaceThreshold, sensitivity),
      ).toMatchObject({
        sustainedMs: expected.noFaceThreshold,
        triggered: true,
      });
    },
  );

  it("preserves a streak through the grace boundary and clears it after the boundary", () => {
    const tracker = new ProctorDecisionTracker();
    const noFace = signalsAtBaseline(BASELINE, { faceCount: 0 });
    const oneFace = signalsAtBaseline();

    updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 0);
    updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 100);
    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", oneFace, 850)).toMatchObject({
      sustainedMs: 850,
      triggered: false,
    });
    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 850)).toMatchObject({ sustainedMs: 850 });

    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", oneFace, 1601)).toMatchObject({
      sustainedMs: 0,
      triggered: false,
    });
    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 1700)).toMatchObject({
      sustainedMs: 0,
      triggered: false,
    });
  });

  it("starts a fresh streak when the first frame after a long pause is active", () => {
    const tracker = new ProctorDecisionTracker();
    const noFace = signalsAtBaseline(BASELINE, { faceCount: 0 });
    const oneFace = signalsAtBaseline();

    updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 0);
    updateDecision(tracker, "FACE_NOT_VISIBLE", oneFace, 100);

    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 10000)).toMatchObject({
      sustainedMs: 0,
      triggered: false,
    });
  });

  it("re-emits only when the cooldown boundary is reached", () => {
    const tracker = new ProctorDecisionTracker();
    const noFace = signalsAtBaseline(BASELINE, { faceCount: 0 });

    updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 0, "STRICT");
    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 1400, "STRICT").triggered).toBe(true);
    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 16399, "STRICT").triggered).toBe(false);
    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 16400, "STRICT").triggered).toBe(true);
  });

  it("reset clears sustained time and cooldown history", () => {
    const tracker = new ProctorDecisionTracker();
    const noFace = signalsAtBaseline(BASELINE, { faceCount: 0 });

    updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 0, "STRICT");
    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 1400, "STRICT").triggered).toBe(true);

    tracker.reset();

    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 1400, "STRICT")).toMatchObject({
      sustainedMs: 0,
      triggered: false,
    });
    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 2800, "STRICT")).toMatchObject({
      sustainedMs: 1400,
      triggered: true,
    });
  });

  it("automatically resets all clocks when time moves backward", () => {
    const tracker = new ProctorDecisionTracker();
    const noFace = signalsAtBaseline(BASELINE, { faceCount: 0 });

    updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 1000, "STRICT");
    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 500, "STRICT")).toMatchObject({
      sustainedMs: 0,
      triggered: false,
    });
    expect(updateDecision(tracker, "FACE_NOT_VISIBLE", noFace, 1900, "STRICT")).toMatchObject({
      sustainedMs: 1400,
      triggered: true,
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects non-finite timestamps (%s)",
    (nowMs) => {
      const tracker = new ProctorDecisionTracker();

      expect(() => tracker.update(signalsAtBaseline(), BASELINE, "STANDARD", nowMs)).toThrow(
        "A finite timestamp is required",
      );
    },
  );
});
