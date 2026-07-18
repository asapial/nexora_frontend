import type { FaceLandmarker, Matrix, ObjectDetector } from "@mediapipe/tasks-vision";

export type VisionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VisionDeviceCategory = "cell phone" | "laptop" | "tablet" | "remote";

export type VisionDeviceDetection = {
  category: VisionDeviceCategory;
  label: string;
  confidence: number;
  boxAspectRatio: number;
  boxAreaRatio: number;
  faceOverlap: number;
  box: VisionBox;
  model: string;
};

export type VisionSignals = {
  faceCount: number;
  headYaw: number | null;
  headPitch: number | null;
  headRoll: number | null;
  eyeHorizontal: number | null;
  eyeVertical: number | null;
  leftEyeHorizontal: number | null;
  rightEyeHorizontal: number | null;
  leftEyeVertical: number | null;
  rightEyeVertical: number | null;
  eyeAgreement: number | null;
  eyeVerticalAgreement: number | null;
  detectedDevices: VisionDeviceDetection[];
  phoneConfidence: number | null;
  phoneBoxAspectRatio: number | null;
  phoneBoxAreaRatio: number | null;
  phoneFaceOverlap: number | null;
  faceBox: VisionBox | null;
  phoneBox: VisionBox | null;
  phoneModel: string | null;
  deviceModel: string | null;
  deviceDetectorHealthy: boolean;
  deviceScanIntervalMs: number;
  processingTimeMs: number;
  frameWidth: number;
  frameHeight: number;
};

export type FaceMetrics = Pick<
  VisionSignals,
  | "headYaw"
  | "headPitch"
  | "headRoll"
  | "eyeHorizontal"
  | "eyeVertical"
  | "leftEyeHorizontal"
  | "rightEyeHorizontal"
  | "leftEyeVertical"
  | "rightEyeVertical"
  | "eyeAgreement"
  | "eyeVerticalAgreement"
>;

type Landmark = { x: number; y: number; z?: number };
type PixelBox = { originX: number; originY: number; width: number; height: number };
type FaceBounds = { left: number; top: number; right: number; bottom: number };
type RawDeviceDetection = {
  categories: Array<{ categoryName?: string; displayName?: string; score: number }>;
  boundingBox?: PixelBox;
};

const MODEL_BASE = "https://storage.googleapis.com/mediapipe-models";
const FACE_MODEL = `${MODEL_BASE}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`;
const OBJECT_MODELS = [
  { name: "EfficientDet-Lite0", path: `${MODEL_BASE}/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite` },
  { name: "SSD MobileNet V2", path: `${MODEL_BASE}/object_detector/ssd_mobilenet_v2/float32/1/ssd_mobilenet_v2.tflite` },
] as const;

export const PROHIBITED_DEVICE_CATEGORIES: readonly VisionDeviceCategory[] = [
  "cell phone",
  "laptop",
  "tablet",
  "remote",
] as const;

const DEVICE_LABELS: Record<VisionDeviceCategory, string> = {
  "cell phone": "Phone",
  laptop: "Laptop",
  tablet: "Tablet",
  remote: "Remote device",
};

const EMPTY_METRICS: FaceMetrics = {
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

export const createEmptyVisionSignals = (): VisionSignals => ({
  faceCount: 0,
  ...EMPTY_METRICS,
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

const ratio = (value: number, first: number, second: number) => {
  const minimum = Math.min(first, second);
  const width = Math.abs(first - second);
  return width > 0.001 ? (value - minimum) / width : 0.5;
};

const center = (landmarks: Landmark[], indexes: number[], axis: "x" | "y") => {
  const points = indexes.map((index) => landmarks[index]).filter(Boolean);
  return points.length === indexes.length
    ? points.reduce((sum, point) => sum + point[axis], 0) / points.length
    : null;
};

/** Converts MediaPipe's facial transformation matrix into baseline-relative Euler angles. */
export const poseFromTransformationMatrix = (matrix?: Pick<Matrix, "rows" | "columns" | "data"> | null) => {
  if (!matrix || matrix.rows !== 4 || matrix.columns !== 4 || matrix.data.length < 16) return null;
  const values = matrix.data;
  const horizontalScale = Math.hypot(values[0]!, values[4]!);
  const singular = horizontalScale < 1e-6;
  const pitch = singular ? Math.atan2(-values[6]!, values[5]!) : Math.atan2(values[9]!, values[10]!);
  const yaw = Math.atan2(-values[8]!, horizontalScale);
  const roll = singular ? 0 : Math.atan2(values[4]!, values[0]!);
  return { headYaw: yaw, headPitch: pitch, headRoll: roll };
};

/** Pure landmark math used by both the live runtime and Vitest fixtures. */
export const calculateFaceMetrics = (
  landmarks: Landmark[],
  transformationMatrix?: Pick<Matrix, "rows" | "columns" | "data"> | null,
): FaceMetrics => {
  const nose = landmarks[1];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const forehead = landmarks[10];
  const chin = landmarks[152];
  const leftEyeCorner = landmarks[33];
  const rightEyeCorner = landmarks[263];
  if (!nose || !leftCheek || !rightCheek) return EMPTY_METRICS;

  const matrixPose = poseFromTransformationMatrix(transformationMatrix);
  const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
  const faceCenterX = (rightCheek.x + leftCheek.x) / 2;
  const landmarkYaw = faceWidth > 0.001 ? ((nose.x - faceCenterX) / faceWidth) * 2 : null;
  const faceHeight = forehead && chin ? Math.abs(chin.y - forehead.y) : 0;
  const landmarkPitch = forehead && chin && faceHeight > 0.001
    ? ((nose.y - (forehead.y + chin.y) / 2) / faceHeight) * 2
    : null;
  const landmarkRoll = leftEyeCorner && rightEyeCorner
    ? Math.atan2(rightEyeCorner.y - leftEyeCorner.y, rightEyeCorner.x - leftEyeCorner.x)
    : null;

  const leftOuter = landmarks[33];
  const leftInner = landmarks[133];
  const rightInner = landmarks[362];
  const rightOuter = landmarks[263];
  const leftUpper = landmarks[159];
  const leftLower = landmarks[145];
  const rightUpper = landmarks[386];
  const rightLower = landmarks[374];
  const leftIrisX = center(landmarks, [468, 469, 470, 471, 472], "x");
  const rightIrisX = center(landmarks, [473, 474, 475, 476, 477], "x");
  const leftIrisY = center(landmarks, [468, 469, 470, 471, 472], "y");
  const rightIrisY = center(landmarks, [473, 474, 475, 476, 477], "y");
  const leftEyeHorizontal = leftIrisX !== null && leftOuter && leftInner ? ratio(leftIrisX, leftOuter.x, leftInner.x) : null;
  const rightEyeHorizontal = rightIrisX !== null && rightOuter && rightInner ? ratio(rightIrisX, rightOuter.x, rightInner.x) : null;
  const leftEyeVertical = leftIrisY !== null && leftUpper && leftLower ? ratio(leftIrisY, leftUpper.y, leftLower.y) : null;
  const rightEyeVertical = rightIrisY !== null && rightUpper && rightLower ? ratio(rightIrisY, rightUpper.y, rightLower.y) : null;
  const eyeHorizontal = leftEyeHorizontal !== null && rightEyeHorizontal !== null ? (leftEyeHorizontal + rightEyeHorizontal) / 2 : null;
  const eyeVertical = leftEyeVertical !== null && rightEyeVertical !== null ? (leftEyeVertical + rightEyeVertical) / 2 : null;

  return {
    headYaw: matrixPose?.headYaw ?? landmarkYaw,
    headPitch: matrixPose?.headPitch ?? landmarkPitch,
    headRoll: matrixPose?.headRoll ?? landmarkRoll,
    eyeHorizontal,
    eyeVertical,
    leftEyeHorizontal,
    rightEyeHorizontal,
    leftEyeVertical,
    rightEyeVertical,
    eyeAgreement: leftEyeHorizontal !== null && rightEyeHorizontal !== null ? Math.abs(leftEyeHorizontal - rightEyeHorizontal) : null,
    eyeVerticalAgreement: leftEyeVertical !== null && rightEyeVertical !== null ? Math.abs(leftEyeVertical - rightEyeVertical) : null,
  };
};

const faceBounds = (landmarks: Landmark[], width: number, height: number): FaceBounds | null => {
  if (!landmarks.length || width <= 0 || height <= 0) return null;
  const xs = landmarks.map((point) => point.x * width);
  const ys = landmarks.map((point) => point.y * height);
  return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
};

const normalizedBox = (box: PixelBox, width: number, height: number): VisionBox => ({
  x: box.originX / width,
  y: box.originY / height,
  width: box.width / width,
  height: box.height / height,
});

const overlapRatio = (box: PixelBox, face: FaceBounds | null) => {
  if (!face) return 0;
  const overlapWidth = Math.max(0, Math.min(box.originX + box.width, face.right) - Math.max(box.originX, face.left));
  const overlapHeight = Math.max(0, Math.min(box.originY + box.height, face.bottom) - Math.max(box.originY, face.top));
  return (overlapWidth * overlapHeight) / (box.width * box.height);
};

const normalizeDeviceCategory = (value: string): VisionDeviceCategory | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "mobile phone" || normalized === "smartphone") return "cell phone";
  return PROHIBITED_DEVICE_CATEGORIES.includes(normalized as VisionDeviceCategory)
    ? normalized as VisionDeviceCategory
    : null;
};

/** Filters implausible boxes without rejecting devices simply because they overlap a face. */
export const selectDeviceDetections = (
  detections: RawDeviceDetection[],
  frameWidth: number,
  frameHeight: number,
  face: FaceBounds | null,
  model: string,
): VisionDeviceDetection[] => {
  if (frameWidth <= 0 || frameHeight <= 0) return [];
  const frameArea = frameWidth * frameHeight;
  return detections
    .map((detection) => {
      const categoryResult = detection.categories
        .map((category) => ({ ...category, normalized: normalizeDeviceCategory(category.categoryName || category.displayName || "") }))
        .find((category) => category.normalized !== null);
      const box = detection.boundingBox;
      if (!categoryResult?.normalized || !box || box.width <= 0 || box.height <= 0) return null;
      const areaRatio = (box.width * box.height) / frameArea;
      const category = categoryResult.normalized;
      const minimumArea = category === "cell phone" || category === "remote" ? 0.0015 : 0.008;
      if (areaRatio < minimumArea || areaRatio > 0.72) return null;
      return {
        category,
        label: DEVICE_LABELS[category],
        confidence: categoryResult.score,
        boxAspectRatio: box.width / box.height,
        boxAreaRatio: areaRatio,
        faceOverlap: overlapRatio(box, face),
        box: normalizedBox(box, frameWidth, frameHeight),
        model,
      } satisfies VisionDeviceDetection;
    })
    .filter((candidate): candidate is VisionDeviceDetection => candidate !== null)
    .sort((first, second) => second.confidence - first.confidence)
    .slice(0, 4);
};

const smooth = (previous: number | null, next: number | null, alpha = 0.48) =>
  next === null ? null : previous === null ? next : previous + alpha * (next - previous);

export class ExamShieldVision {
  private faceLandmarker: FaceLandmarker | null = null;
  private objectDetector: { name: string; detector: ObjectDetector } | null = null;
  private lastObjectDetectionAt = Number.NEGATIVE_INFINITY;
  private detectedDevices: VisionDeviceDetection[] = [];
  private smoothedMetrics: FaceMetrics = { ...EMPTY_METRICS };

  constructor(private readonly deviceScanIntervalMs = 180) {}

  async initialize() {
    const { FaceLandmarker, FilesetResolver, ObjectDetector } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks("/models/examshield");
    const faceOptions = {
      runningMode: "VIDEO" as const,
      numFaces: 2,
      minFaceDetectionConfidence: 0.45,
      minFacePresenceConfidence: 0.45,
      minTrackingConfidence: 0.45,
      outputFacialTransformationMatrixes: true,
    };
    const createFaceLandmarker = async () => {
      try {
        return await FaceLandmarker.createFromOptions(fileset, {
          ...faceOptions,
          baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
        });
      } catch {
        return FaceLandmarker.createFromOptions(fileset, {
          ...faceOptions,
          baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
        });
      }
    };
    const createObjectDetector = async () => {
      const objectOptions = {
        runningMode: "VIDEO" as const,
        scoreThreshold: 0.2,
        maxResults: 8,
        categoryAllowlist: [...PROHIBITED_DEVICE_CATEGORIES],
      };
      for (const model of OBJECT_MODELS) {
        for (const delegate of ["GPU", "CPU"] as const) {
          try {
            const detector = await ObjectDetector.createFromOptions(fileset, {
              ...objectOptions,
              baseOptions: { modelAssetPath: model.path, delegate },
            });
            return { name: model.name, detector };
          } catch {
            // Try the next delegate/model. Face tracking can still report a useful initialization error.
          }
        }
      }
      return null;
    };

    const [faceLandmarker, objectDetector] = await Promise.all([createFaceLandmarker(), createObjectDetector()]);
    this.faceLandmarker = faceLandmarker;
    this.objectDetector = objectDetector;
    return {
      phoneDetectionSupported: Boolean(objectDetector),
      deviceDetectionSupported: Boolean(objectDetector),
      phoneModel: objectDetector?.name ?? null,
      deviceModel: objectDetector?.name ?? null,
      deviceScanIntervalMs: this.deviceScanIntervalMs,
    };
  }

  analyze(video: HTMLVideoElement, timestamp: number): VisionSignals {
    if (!this.faceLandmarker) throw new Error("Vision engine is not ready");
    const startedAt = globalThis.performance?.now?.() ?? Date.now();
    const faceResult = this.faceLandmarker.detectForVideo(video, timestamp);
    const firstFace = faceResult.faceLandmarks[0];
    const metrics = firstFace
      ? calculateFaceMetrics(firstFace, faceResult.facialTransformationMatrixes[0])
      : EMPTY_METRICS;
    for (const key of Object.keys(EMPTY_METRICS) as Array<keyof FaceMetrics>) {
      this.smoothedMetrics[key] = smooth(this.smoothedMetrics[key], metrics[key]);
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    const bounds = faceBounds(firstFace ?? [], width, height);
    if (this.objectDetector && timestamp - this.lastObjectDetectionAt >= this.deviceScanIntervalMs) {
      this.lastObjectDetectionAt = timestamp;
      try {
        const result = this.objectDetector.detector.detectForVideo(video, timestamp);
        this.detectedDevices = selectDeviceDetections(result.detections, width, height, bounds, this.objectDetector.name);
      } catch {
        this.objectDetector.detector.close();
        this.objectDetector = null;
        this.detectedDevices = [];
      }
    }
    const phone = this.detectedDevices.find((device) => device.category === "cell phone") ?? null;
    const finishedAt = globalThis.performance?.now?.() ?? Date.now();

    return {
      faceCount: faceResult.faceLandmarks.length,
      ...this.smoothedMetrics,
      detectedDevices: this.detectedDevices,
      phoneConfidence: phone?.confidence ?? null,
      phoneBoxAspectRatio: phone?.boxAspectRatio ?? null,
      phoneBoxAreaRatio: phone?.boxAreaRatio ?? null,
      phoneFaceOverlap: phone?.faceOverlap ?? null,
      faceBox: bounds ? {
        x: bounds.left / width,
        y: bounds.top / height,
        width: (bounds.right - bounds.left) / width,
        height: (bounds.bottom - bounds.top) / height,
      } : null,
      phoneBox: phone?.box ?? null,
      phoneModel: phone?.model ?? this.objectDetector?.name ?? null,
      deviceModel: this.objectDetector?.name ?? null,
      deviceDetectorHealthy: Boolean(this.objectDetector),
      deviceScanIntervalMs: this.deviceScanIntervalMs,
      processingTimeMs: Math.max(0, finishedAt - startedAt),
      frameWidth: width,
      frameHeight: height,
    };
  }

  close() {
    this.faceLandmarker?.close();
    this.objectDetector?.detector.close();
    this.faceLandmarker = null;
    this.objectDetector = null;
    this.lastObjectDetectionAt = Number.NEGATIVE_INFINITY;
    this.detectedDevices = [];
    this.smoothedMetrics = { ...EMPTY_METRICS };
  }
}
