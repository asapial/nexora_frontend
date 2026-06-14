import type { FaceLandmarker, ObjectDetector } from "@mediapipe/tasks-vision";

export type VisionSignals = {
  faceCount: number;
  headYaw: number | null;
  eyeHorizontal: number | null;
  leftEyeHorizontal: number | null;
  rightEyeHorizontal: number | null;
  eyeAgreement: number | null;
  phoneConfidence: number | null;
  phoneBoxAspectRatio: number | null;
  phoneBoxAreaRatio: number | null;
  phoneFaceOverlap: number | null;
  faceBox: VisionBox | null;
  phoneBox: VisionBox | null;
  phoneModel: string | null;
};

export type VisionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MODEL_BASE = "https://storage.googleapis.com/mediapipe-models";
const FACE_MODEL = `${MODEL_BASE}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`;
const OBJECT_MODELS = [
  { name: "EfficientDet-Lite2", path: `${MODEL_BASE}/object_detector/efficientdet_lite2/float16/1/efficientdet_lite2.tflite` },
  { name: "SSD MobileNet V2", path: `${MODEL_BASE}/object_detector/ssd_mobilenet_v2/float32/1/ssd_mobilenet_v2.tflite` },
] as const;

const ratio = (value: number, first: number, second: number) => {
  const minimum = Math.min(first, second);
  const width = Math.abs(first - second);
  return width > 0.001 ? (value - minimum) / width : 0.5;
};

const centerX = (landmarks: Array<{ x: number }>, indexes: number[]) => {
  const points = indexes.map((index) => landmarks[index]).filter(Boolean);
  return points.length === indexes.length ? points.reduce((sum, point) => sum + point.x, 0) / points.length : null;
};

const faceMetrics = (landmarks: Array<{ x: number; y: number; z: number }>) => {
  const nose = landmarks[1];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  if (!nose || !leftCheek || !rightCheek) return { headYaw: null, eyeHorizontal: null, leftEyeHorizontal: null, rightEyeHorizontal: null, eyeAgreement: null };

  const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
  const faceCenter = (rightCheek.x + leftCheek.x) / 2;
  const headYaw = faceWidth > 0.001 ? ((nose.x - faceCenter) / faceWidth) * 2 : null;

  const leftOuter = landmarks[33];
  const leftInner = landmarks[133];
  const rightInner = landmarks[362];
  const rightOuter = landmarks[263];
  const leftIrisX = centerX(landmarks, [468, 469, 470, 471, 472]);
  const rightIrisX = centerX(landmarks, [473, 474, 475, 476, 477]);
  const leftEyeHorizontal = leftIrisX !== null && leftOuter && leftInner ? ratio(leftIrisX, leftOuter.x, leftInner.x) : null;
  const rightEyeHorizontal = rightIrisX !== null && rightOuter && rightInner ? ratio(rightIrisX, rightOuter.x, rightInner.x) : null;
  const eyeHorizontal = leftEyeHorizontal !== null && rightEyeHorizontal !== null ? (leftEyeHorizontal + rightEyeHorizontal) / 2 : null;
  const eyeAgreement = leftEyeHorizontal !== null && rightEyeHorizontal !== null ? Math.abs(leftEyeHorizontal - rightEyeHorizontal) : null;

  return { headYaw, eyeHorizontal, leftEyeHorizontal, rightEyeHorizontal, eyeAgreement };
};

const faceBounds = (landmarks: Array<{ x: number; y: number }>, width: number, height: number) => {
  if (!landmarks.length) return null;
  const xs = landmarks.map((point) => point.x * width);
  const ys = landmarks.map((point) => point.y * height);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  return { left, top, right: Math.max(...xs), bottom: Math.max(...ys) };
};

const normalizedBox = (box: { originX: number; originY: number; width: number; height: number }, width: number, height: number): VisionBox => ({
  x: box.originX / width,
  y: box.originY / height,
  width: box.width / width,
  height: box.height / height,
});

const overlapRatio = (
  box: { originX: number; originY: number; width: number; height: number },
  face: { left: number; top: number; right: number; bottom: number } | null,
) => {
  if (!face) return 0;
  const overlapWidth = Math.max(0, Math.min(box.originX + box.width, face.right) - Math.max(box.originX, face.left));
  const overlapHeight = Math.max(0, Math.min(box.originY + box.height, face.bottom) - Math.max(box.originY, face.top));
  return (overlapWidth * overlapHeight) / (box.width * box.height);
};

const smooth = (previous: number | null, next: number | null, alpha = 0.4) =>
  next === null ? null : previous === null ? next : previous + alpha * (next - previous);

export class ExamShieldVision {
  private faceLandmarker: FaceLandmarker | null = null;
  private objectDetectors: Array<{ name: string; detector: ObjectDetector }> = [];
  private nextObjectDetector = 0;
  private lastObjectDetectionAt = 0;
  private lastPhoneConfidence: number | null = null;
  private lastPhoneBoxAspectRatio: number | null = null;
  private lastPhoneBoxAreaRatio: number | null = null;
  private lastPhoneFaceOverlap: number | null = null;
  private lastPhoneBox: VisionBox | null = null;
  private phoneModel: string | null = null;
  private smoothedHeadYaw: number | null = null;
  private smoothedLeftEye: number | null = null;
  private smoothedRightEye: number | null = null;

  async initialize() {
    const { FaceLandmarker, FilesetResolver, ObjectDetector } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks("/models/examshield");
    const faceOptions = {
      runningMode: "VIDEO" as const,
      numFaces: 2,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    };
    try {
      this.faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        ...faceOptions,
        baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
      });
    } catch {
      this.faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        ...faceOptions,
        baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
      });
    }
    const objectOptions = {
      runningMode: "VIDEO" as const,
      scoreThreshold: 0.2,
      maxResults: 5,
      categoryAllowlist: ["cell phone"],
    };
    for (const model of OBJECT_MODELS) {
      let detector: ObjectDetector | null = null;
      try {
        detector = await ObjectDetector.createFromOptions(fileset, {
          ...objectOptions,
          baseOptions: { modelAssetPath: model.path, delegate: "GPU" },
        });
      } catch {
        try {
          detector = await ObjectDetector.createFromOptions(fileset, {
            ...objectOptions,
            baseOptions: { modelAssetPath: model.path, delegate: "CPU" },
          });
        } catch {
          detector = null;
        }
      }
      if (detector) this.objectDetectors.push({ name: model.name, detector });
    }
    this.phoneModel = this.objectDetectors.map((item) => item.name).join(" + ") || null;
    return { phoneDetectionSupported: this.objectDetectors.length > 0, phoneModel: this.phoneModel };
  }

  analyze(video: HTMLVideoElement, timestamp: number): VisionSignals {
    if (!this.faceLandmarker) throw new Error("Vision engine is not ready");
    const faceResult = this.faceLandmarker.detectForVideo(video, timestamp);
    const metrics = faceResult.faceLandmarks[0]
      ? faceMetrics(faceResult.faceLandmarks[0])
      : { headYaw: null, eyeHorizontal: null, leftEyeHorizontal: null, rightEyeHorizontal: null, eyeAgreement: null };
    this.smoothedHeadYaw = smooth(this.smoothedHeadYaw, metrics.headYaw);
    this.smoothedLeftEye = smooth(this.smoothedLeftEye, metrics.leftEyeHorizontal);
    this.smoothedRightEye = smooth(this.smoothedRightEye, metrics.rightEyeHorizontal);
    const smoothedEyeHorizontal = this.smoothedLeftEye !== null && this.smoothedRightEye !== null
      ? (this.smoothedLeftEye + this.smoothedRightEye) / 2
      : null;
    const smoothedEyeAgreement = this.smoothedLeftEye !== null && this.smoothedRightEye !== null
      ? Math.abs(this.smoothedLeftEye - this.smoothedRightEye)
      : null;
    const bounds = faceBounds(faceResult.faceLandmarks[0] ?? [], video.videoWidth, video.videoHeight);

    if (this.objectDetectors.length && timestamp - this.lastObjectDetectionAt >= 300) {
      this.lastObjectDetectionAt = timestamp;
      const currentDetector = this.objectDetectors[this.nextObjectDetector % this.objectDetectors.length]!;
      this.nextObjectDetector += 1;
      const result = currentDetector.detector.detectForVideo(video, timestamp);
      const candidates = result.detections
        .map((detection) => {
          const category = detection.categories.find((item) => item.categoryName === "cell phone");
          const box = detection.boundingBox;
          if (!category || !box || box.width <= 0 || box.height <= 0) return null;
          const aspectRatio = box.width / box.height;
          const areaRatio = (box.width * box.height) / (video.videoWidth * video.videoHeight);
          const faceOverlap = overlapRatio(box, bounds);
          const rectangular = aspectRatio <= 0.82 || aspectRatio >= 1.22;
          const plausibleSize = areaRatio >= 0.004 && areaRatio <= 0.45;
          const outsideFace = faceOverlap <= 0.28;
          return rectangular && plausibleSize && outsideFace ? { confidence: category.score, aspectRatio, areaRatio, faceOverlap, box: normalizedBox(box, video.videoWidth, video.videoHeight), model: currentDetector.name } : null;
        })
        .filter((candidate): candidate is { confidence: number; aspectRatio: number; areaRatio: number; faceOverlap: number; box: VisionBox; model: string } => Boolean(candidate))
        .sort((first, second) => second.confidence - first.confidence);
      const phone = candidates[0] ?? null;
      this.lastPhoneConfidence = phone?.confidence ?? null;
      this.lastPhoneBoxAspectRatio = phone?.aspectRatio ?? null;
      this.lastPhoneBoxAreaRatio = phone?.areaRatio ?? null;
      this.lastPhoneFaceOverlap = phone?.faceOverlap ?? null;
      this.lastPhoneBox = phone?.box ?? null;
      this.phoneModel = phone?.model ?? this.objectDetectors.map((item) => item.name).join(" + ");
    }

    return {
      faceCount: faceResult.faceLandmarks.length,
      headYaw: this.smoothedHeadYaw,
      eyeHorizontal: smoothedEyeHorizontal,
      leftEyeHorizontal: this.smoothedLeftEye,
      rightEyeHorizontal: this.smoothedRightEye,
      eyeAgreement: smoothedEyeAgreement,
      phoneConfidence: this.lastPhoneConfidence,
      phoneBoxAspectRatio: this.lastPhoneBoxAspectRatio,
      phoneBoxAreaRatio: this.lastPhoneBoxAreaRatio,
      phoneFaceOverlap: this.lastPhoneFaceOverlap,
      faceBox: bounds ? {
        x: bounds.left / video.videoWidth,
        y: bounds.top / video.videoHeight,
        width: (bounds.right - bounds.left) / video.videoWidth,
        height: (bounds.bottom - bounds.top) / video.videoHeight,
      } : null,
      phoneBox: this.lastPhoneBox,
      phoneModel: this.phoneModel,
    };
  }

  close() {
    this.faceLandmarker?.close();
    this.objectDetectors.forEach(({ detector }) => detector.close());
    this.faceLandmarker = null;
    this.objectDetectors = [];
    this.nextObjectDetector = 0;
    this.phoneModel = null;
    this.smoothedHeadYaw = null;
    this.smoothedLeftEye = null;
    this.smoothedRightEye = null;
  }
}
