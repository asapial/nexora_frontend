import { describe, expect, it } from "vitest";

import {
  calculateFaceMetrics,
  createEmptyVisionSignals,
  DeviceConfirmationTracker,
  poseFromTransformationMatrix,
  selectDeviceDetections,
} from "./vision";

type Landmark = Parameters<typeof calculateFaceMetrics>[0][number];
type MatrixInput = NonNullable<Parameters<typeof poseFromTransformationMatrix>[0]>;
type RawDeviceDetection = Parameters<typeof selectDeviceDetections>[0][number];
type PixelBox = NonNullable<RawDeviceDetection["boundingBox"]>;

const nullMetrics = {
  headYaw: null,
  headPitch: null,
  headRoll: null,
  eyeHorizontal: null,
  eyeVertical: null,
  leftEyeHorizontal: null,
  rightEyeHorizontal: null,
  leftEyeVertical: null,
  rightEyeVertical: null,
  eyeAgreement: null,
  eyeVerticalAgreement: null,
};

const makeFaceLandmarks = (): Landmark[] => {
  const landmarks: Landmark[] = [];

  landmarks[1] = { x: 0.6, y: 0.65 };
  landmarks[10] = { x: 0.5, y: 0.2 };
  landmarks[152] = { x: 0.5, y: 0.8 };
  landmarks[234] = { x: 0.2, y: 0.5 };
  landmarks[454] = { x: 0.8, y: 0.5 };

  landmarks[33] = { x: 0.3, y: 0.45 };
  landmarks[133] = { x: 0.5, y: 0.45 };
  landmarks[263] = { x: 0.7, y: 0.55 };
  landmarks[362] = { x: 0.5, y: 0.55 };
  landmarks[159] = { x: 0.4, y: 0.4 };
  landmarks[145] = { x: 0.4, y: 0.6 };
  landmarks[386] = { x: 0.6, y: 0.4 };
  landmarks[374] = { x: 0.6, y: 0.6 };

  for (const index of [468, 469, 470, 471, 472]) {
    landmarks[index] = { x: 0.45, y: 0.45 };
  }
  for (const index of [473, 474, 475, 476, 477]) {
    landmarks[index] = { x: 0.55, y: 0.55 };
  }

  return landmarks;
};

const matrixForPose = (headPitch: number, headYaw: number, headRoll: number): MatrixInput => {
  const cp = Math.cos(headPitch);
  const sp = Math.sin(headPitch);
  const cy = Math.cos(headYaw);
  const sy = Math.sin(headYaw);
  const cr = Math.cos(headRoll);
  const sr = Math.sin(headRoll);

  return {
    rows: 4,
    columns: 4,
    data: [
      cr * cy,
      cr * sy * sp - sr * cp,
      cr * sy * cp + sr * sp,
      0,
      sr * cy,
      sr * sy * sp + cr * cp,
      sr * sy * cp - cr * sp,
      0,
      -sy,
      cy * sp,
      cy * cp,
      0,
      0,
      0,
      0,
      1,
    ],
  };
};

const defaultBox: PixelBox = { originX: 100, originY: 100, width: 100, height: 100 };

const detection = (
  categoryName: string,
  score = 0.8,
  boundingBox: PixelBox = defaultBox,
): RawDeviceDetection => ({
  categories: [{ categoryName, score }],
  boundingBox,
});

describe("createEmptyVisionSignals", () => {
  it("returns complete neutral signals with an independent device list", () => {
    const first = createEmptyVisionSignals();
    const second = createEmptyVisionSignals();

    expect(first).toEqual({
      faceCount: 0,
      ...nullMetrics,
      detectedDevices: [],
      phoneConfidence: null,
      phoneBoxAspectRatio: null,
      phoneBoxAreaRatio: null,
      phoneFaceOverlap: null,
      faceBox: null,
      phoneBox: null,
      phoneModel: null,
      deviceModel: null,
      deviceDetectorHealthy: false,
      deviceScanIntervalMs: 180,
      processingTimeMs: 0,
      frameWidth: 0,
      frameHeight: 0,
    });
    expect(first.detectedDevices).not.toBe(second.detectedDevices);
  });
});

describe("poseFromTransformationMatrix", () => {
  it("extracts pitch, yaw, and roll from a valid 4x4 rotation matrix", () => {
    const pose = poseFromTransformationMatrix(matrixForPose(0.2, -0.3, 0.4));

    expect(pose?.headPitch).toBeCloseTo(0.2, 10);
    expect(pose?.headYaw).toBeCloseTo(-0.3, 10);
    expect(pose?.headRoll).toBeCloseTo(0.4, 10);
  });

  it("uses the singular-matrix branch at a ninety-degree yaw", () => {
    const pose = poseFromTransformationMatrix(matrixForPose(0.25, Math.PI / 2, 0));

    expect(pose?.headPitch).toBeCloseTo(0.25, 10);
    expect(pose?.headYaw).toBeCloseTo(Math.PI / 2, 10);
    expect(pose?.headRoll).toBe(0);
  });

  it.each([
    undefined,
    null,
    { rows: 3, columns: 4, data: Array(16).fill(0) },
    { rows: 4, columns: 3, data: Array(16).fill(0) },
    { rows: 4, columns: 4, data: Array(15).fill(0) },
  ] satisfies Array<MatrixInput | null | undefined>)("rejects an absent or structurally invalid matrix", (matrix) => {
    expect(poseFromTransformationMatrix(matrix)).toBeNull();
  });
});

describe("calculateFaceMetrics", () => {
  it("calculates landmark head geometry and independent horizontal and vertical gaze", () => {
    const metrics = calculateFaceMetrics(makeFaceLandmarks());

    expect(metrics.headYaw).toBeCloseTo(1 / 3, 10);
    expect(metrics.headPitch).toBeCloseTo(0.5, 10);
    expect(metrics.headRoll).toBeCloseTo(Math.atan2(0.1, 0.4), 10);
    expect(metrics.leftEyeHorizontal).toBeCloseTo(0.75, 10);
    expect(metrics.rightEyeHorizontal).toBeCloseTo(0.25, 10);
    expect(metrics.eyeHorizontal).toBeCloseTo(0.5, 10);
    expect(metrics.leftEyeVertical).toBeCloseTo(0.25, 10);
    expect(metrics.rightEyeVertical).toBeCloseTo(0.75, 10);
    expect(metrics.eyeVertical).toBeCloseTo(0.5, 10);
    expect(metrics.eyeAgreement).toBeCloseTo(0.5, 10);
    expect(metrics.eyeVerticalAgreement).toBeCloseTo(0.5, 10);
  });

  it("returns neutral metrics when core face landmarks are missing", () => {
    expect(calculateFaceMetrics([])).toEqual(nullMetrics);
  });

  it("keeps available measurements while nulling metrics whose landmarks are incomplete", () => {
    const landmarks = makeFaceLandmarks();
    Reflect.deleteProperty(landmarks, 10);
    Reflect.deleteProperty(landmarks, 472);

    const metrics = calculateFaceMetrics(landmarks);

    expect(metrics.headYaw).toBeCloseTo(1 / 3, 10);
    expect(metrics.headPitch).toBeNull();
    expect(metrics.headRoll).toBeCloseTo(Math.atan2(0.1, 0.4), 10);
    expect(metrics.leftEyeHorizontal).toBeNull();
    expect(metrics.leftEyeVertical).toBeNull();
    expect(metrics.rightEyeHorizontal).toBeCloseTo(0.25, 10);
    expect(metrics.rightEyeVertical).toBeCloseTo(0.75, 10);
    expect(metrics.eyeHorizontal).toBeNull();
    expect(metrics.eyeVertical).toBeNull();
    expect(metrics.eyeAgreement).toBeNull();
    expect(metrics.eyeVerticalAgreement).toBeNull();
  });

  it("prefers valid matrix pose and falls back to landmark pose for an invalid matrix", () => {
    const landmarks = makeFaceLandmarks();
    const matrixMetrics = calculateFaceMetrics(landmarks, matrixForPose(-0.15, 0.25, -0.35));
    const fallbackMetrics = calculateFaceMetrics(landmarks, { rows: 4, columns: 4, data: [] });

    expect(matrixMetrics.headPitch).toBeCloseTo(-0.15, 10);
    expect(matrixMetrics.headYaw).toBeCloseTo(0.25, 10);
    expect(matrixMetrics.headRoll).toBeCloseTo(-0.35, 10);
    expect(matrixMetrics.eyeHorizontal).toBeCloseTo(0.5, 10);
    expect(fallbackMetrics.headPitch).toBeCloseTo(0.5, 10);
    expect(fallbackMetrics.headYaw).toBeCloseTo(1 / 3, 10);
    expect(fallbackMetrics.headRoll).toBeCloseTo(Math.atan2(0.1, 0.4), 10);
  });

  it("nulls gaze from an iris reflection outside the eye while preserving head pose", () => {
    const landmarks = makeFaceLandmarks();
    for (const index of [468, 469, 470, 471, 472]) {
      landmarks[index] = { x: 0.8, y: 0.45 };
    }

    const metrics = calculateFaceMetrics(landmarks);

    expect(metrics.headYaw).not.toBeNull();
    expect(metrics.leftEyeHorizontal).toBeNull();
    expect(metrics.leftEyeVertical).toBeNull();
    expect(metrics.rightEyeHorizontal).not.toBeNull();
    expect(metrics.eyeHorizontal).toBeNull();
    expect(metrics.eyeVertical).toBeNull();
    expect(metrics.eyeAgreement).toBeNull();
  });

  it("nulls a closed or occluded eye instead of manufacturing a centered gaze", () => {
    const landmarks = makeFaceLandmarks();
    landmarks[159] = { x: 0.4, y: 0.449 };
    landmarks[145] = { x: 0.4, y: 0.451 };

    const metrics = calculateFaceMetrics(landmarks);

    expect(metrics.leftEyeHorizontal).toBeNull();
    expect(metrics.leftEyeVertical).toBeNull();
    expect(metrics.eyeHorizontal).toBeNull();
    expect(metrics.eyeVertical).toBeNull();
  });
});

describe("selectDeviceDetections", () => {
  it.each([
    ["cell phone", "cell phone", "Phone"],
    [" MOBILE PHONE ", "cell phone", "Phone"],
    ["SmartPhone", "cell phone", "Phone"],
    ["LAPTOP", "laptop", "Laptop"],
    [" tablet ", "tablet", "Tablet"],
    ["Remote", "remote", "Remote device"],
  ] as const)("normalizes %s to %s", (rawCategory, expectedCategory, expectedLabel) => {
    const selected = selectDeviceDetections([detection(rawCategory)], 1000, 1000, null, "fixture-model");

    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({
      category: expectedCategory,
      label: expectedLabel,
      confidence: 0.8,
      model: "fixture-model",
    });
  });

  it("uses displayName when categoryName is absent", () => {
    const selected = selectDeviceDetections(
      [{ categories: [{ displayName: "Mobile Phone", score: 0.76 }], boundingBox: defaultBox }],
      1000,
      1000,
      null,
      "display-name-model",
    );

    expect(selected[0]).toMatchObject({ category: "cell phone", label: "Phone", confidence: 0.76 });
  });

  it("sorts all device kinds by confidence and keeps only the top four", () => {
    const selected = selectDeviceDetections(
      [
        detection("cell phone", 0.31),
        detection("laptop", 0.92),
        detection("tablet", 0.55),
        detection("remote", 0.78),
        detection("smartphone", 0.64),
        detection("cell phone", 0.44),
      ],
      1000,
      1000,
      null,
      "ranking-model",
    );

    expect(selected.map(({ confidence }) => confidence)).toEqual([0.92, 0.78, 0.64, 0.55]);
    expect(selected.map(({ category }) => category)).toEqual(["laptop", "remote", "cell phone", "tablet"]);
  });

  it.each([
    ["cell phone", { originX: 0, originY: 0, width: 30, height: 50 }],
    ["remote", { originX: 0, originY: 0, width: 30, height: 50 }],
    ["laptop", { originX: 0, originY: 0, width: 80, height: 100 }],
    ["tablet", { originX: 0, originY: 0, width: 80, height: 100 }],
    ["cell phone", { originX: 0, originY: 0, width: 800, height: 900 }],
  ] as const)("accepts a %s box on an inclusive plausible-size boundary", (category, box) => {
    expect(selectDeviceDetections([detection(category, 0.8, box)], 1000, 1000, null, "model")).toHaveLength(1);
  });

  it.each([
    ["cell phone", { originX: 0, originY: 0, width: 29, height: 50 }],
    ["remote", { originX: 0, originY: 0, width: 29, height: 50 }],
    ["laptop", { originX: 0, originY: 0, width: 79, height: 100 }],
    ["tablet", { originX: 0, originY: 0, width: 79, height: 100 }],
    ["cell phone", { originX: 0, originY: 0, width: 900, height: 900 }],
  ] as const)("rejects an implausibly sized %s box", (category, box) => {
    expect(selectDeviceDetections([detection(category, 0.8, box)], 1000, 1000, null, "model")).toEqual([]);
  });

  it("normalizes boxes and calculates overlap relative to the device box", () => {
    const selected = selectDeviceDetections(
      [detection("cell phone", 0.88, { originX: 100, originY: 200, width: 200, height: 100 })],
      1000,
      500,
      { left: 150, top: 225, right: 250, bottom: 275 },
      "geometry-model",
    );

    expect(selected[0]).toEqual({
      category: "cell phone",
      label: "Phone",
      confidence: 0.88,
      boxAspectRatio: 2,
      boxAreaRatio: 0.04,
      faceOverlap: 0.25,
      eyeBandOverlap: 0,
      confirmationFrames: 1,
      spectacleRisk: false,
      box: { x: 0.1, y: 0.4, width: 0.2, height: 0.2 },
      model: "geometry-model",
    });
  });

  it("retains a plausible device even when its box fully overlaps the face", () => {
    const selected = selectDeviceDetections(
      [detection("remote", 0.7)],
      1000,
      1000,
      { left: 100, top: 100, right: 200, bottom: 200 },
      "overlap-model",
    );

    expect(selected).toHaveLength(1);
    expect(selected[0]?.faceOverlap).toBe(1);
  });

  it("marks a small wide phone candidate across the eye band as a spectacle false-positive risk", () => {
    const selected = selectDeviceDetections(
      [detection("cell phone", 0.82, { originX: 300, originY: 280, width: 300, height: 100 })],
      1000,
      1000,
      { left: 200, top: 100, right: 800, bottom: 800 },
      "spectacle-model",
      { left: 250, top: 250, right: 750, bottom: 450 },
    );

    expect(selected[0]).toMatchObject({
      category: "cell phone",
      boxAspectRatio: 3,
      boxAreaRatio: 0.03,
      faceOverlap: 1,
      eyeBandOverlap: 1,
      confirmationFrames: 1,
      spectacleRisk: true,
    });
  });

  it("does not mark a plausible portrait phone with partial face overlap as spectacle risk", () => {
    const selected = selectDeviceDetections(
      [detection("cell phone", 0.75, { originX: 100, originY: 180, width: 80, height: 200 })],
      1000,
      1000,
      { left: 150, top: 100, right: 650, bottom: 800 },
      "portrait-model",
      { left: 180, top: 220, right: 620, bottom: 400 },
    );

    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({
      boxAspectRatio: 0.4,
      spectacleRisk: false,
      confirmationFrames: 1,
    });
  });

  it.each([
    [0, 1000],
    [-1, 1000],
    [1000, 0],
    [1000, -1],
  ])("rejects invalid frame dimensions %s x %s", (frameWidth, frameHeight) => {
    expect(selectDeviceDetections([detection("cell phone")], frameWidth, frameHeight, null, "model")).toEqual([]);
  });

  it("rejects missing, non-positive, and unsupported detection data", () => {
    const invalid: RawDeviceDetection[] = [
      { categories: [{ categoryName: "person", score: 0.99 }], boundingBox: defaultBox },
      { categories: [{ categoryName: "", score: 0.99 }], boundingBox: defaultBox },
      { categories: [], boundingBox: defaultBox },
      { categories: [{ categoryName: "cell phone", score: 0.99 }] },
      detection("cell phone", 0.99, { ...defaultBox, width: 0 }),
      detection("cell phone", 0.99, { ...defaultBox, width: -1 }),
      detection("cell phone", 0.99, { ...defaultBox, height: 0 }),
      detection("cell phone", 0.99, { ...defaultBox, height: -1 }),
    ];

    expect(selectDeviceDetections(invalid, 1000, 1000, null, "model")).toEqual([]);
  });
});

describe("DeviceConfirmationTracker", () => {
  const makeCandidate = (overrides: Partial<ReturnType<typeof selectDeviceDetections>[number]> = {}) => ({
    category: "cell phone" as const,
    label: "Phone",
    confidence: 0.8,
    boxAspectRatio: 0.5,
    boxAreaRatio: 0.02,
    faceOverlap: 0.2,
    eyeBandOverlap: 0,
    confirmationFrames: 1,
    spectacleRisk: false,
    box: { x: 0.1, y: 0.15, width: 0.1, height: 0.2 },
    model: "fixture-model",
    ...overrides,
  });

  it("confirms an ordinary device after two spatially consistent scans", () => {
    const tracker = new DeviceConfirmationTracker();
    const candidate = makeCandidate();

    expect(tracker.update([candidate], 0)).toEqual([]);
    expect(tracker.update([{ ...candidate, confidence: 0.76 }], 180)).toEqual([
      expect.objectContaining({ category: "cell phone", confidence: 0.76, confirmationFrames: 2, spectacleRisk: false }),
    ]);
  });

  it("requires four consistent high-confidence scans for an eye-band spectacle risk", () => {
    const tracker = new DeviceConfirmationTracker();
    const candidate = makeCandidate({
      confidence: 0.8,
      boxAspectRatio: 3,
      faceOverlap: 1,
      eyeBandOverlap: 1,
      spectacleRisk: true,
      box: { x: 0.3, y: 0.28, width: 0.3, height: 0.1 },
    });

    expect(tracker.update([candidate], 0)).toEqual([]);
    expect(tracker.update([candidate], 180)).toEqual([]);
    expect(tracker.update([candidate], 360)).toEqual([]);
    expect(tracker.update([candidate], 540)).toEqual([
      expect.objectContaining({ confirmationFrames: 4, spectacleRisk: true }),
    ]);
  });

  it("does not confirm a low-confidence spectacle-like candidate even when it persists", () => {
    const tracker = new DeviceConfirmationTracker();
    const candidate = makeCandidate({ confidence: 0.67, spectacleRisk: true });

    for (const timestamp of [0, 180, 360, 540, 720]) {
      expect(tracker.update([candidate], timestamp)).toEqual([]);
    }
  });

  it("does not combine distant boxes into evidence for one physical device", () => {
    const tracker = new DeviceConfirmationTracker();
    const first = makeCandidate();
    const distant = makeCandidate({ box: { x: 0.75, y: 0.7, width: 0.1, height: 0.2 } });

    expect(tracker.update([first], 0)).toEqual([]);
    expect(tracker.update([distant], 180)).toEqual([]);
  });

  it("does not combine category jitter into a confirmed device", () => {
    const tracker = new DeviceConfirmationTracker();
    const phone = makeCandidate();
    const remote = makeCandidate({ category: "remote", label: "Remote device" });

    expect(tracker.update([phone], 0)).toEqual([]);
    expect(tracker.update([remote], 180)).toEqual([]);
    expect(tracker.update([phone], 360)).toEqual([]);
  });

  it("keeps one missed scan only after a device has already been confirmed", () => {
    const tracker = new DeviceConfirmationTracker();
    const candidate = makeCandidate();

    tracker.update([candidate], 0);
    expect(tracker.update([candidate], 180)).toHaveLength(1);
    expect(tracker.update([], 360)).toHaveLength(1);
    expect(tracker.update([], 540)).toEqual([]);
  });
});
