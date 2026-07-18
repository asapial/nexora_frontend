type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: (now: number) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export const startVideoFrameLoop = (
  video: HTMLVideoElement,
  callback: (now: number) => void,
  targetFps = 30,
) => {
  const source = video as VideoWithFrameCallback;
  const usesVideoFrameCallback = typeof source.requestVideoFrameCallback === "function";
  const safeTargetFps = Number.isFinite(targetFps) ? Math.max(1, Math.min(60, targetFps)) : 24;
  const minimumFrameTime = 1000 / safeTargetFps;
  let active = true;
  let handle = 0;
  let lastRun = Number.NEGATIVE_INFINITY;
  let lastVideoTime = Number.NEGATIVE_INFINITY;

  const run = (now: number) => {
    if (!active) return;
    const videoTime = source.currentTime;
    const hasNewFrame = usesVideoFrameCallback || videoTime !== lastVideoTime;
    if (hasNewFrame && now - lastRun >= minimumFrameTime) {
      lastRun = now;
      lastVideoTime = videoTime;
      callback(now);
    }
    handle = usesVideoFrameCallback
      ? source.requestVideoFrameCallback!(run)
      : requestAnimationFrame(run);
  };

  handle = usesVideoFrameCallback
    ? source.requestVideoFrameCallback!(run)
    : requestAnimationFrame(run);

  return () => {
    active = false;
    if (usesVideoFrameCallback && source.cancelVideoFrameCallback) source.cancelVideoFrameCallback(handle);
    else cancelAnimationFrame(handle);
  };
};
