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
  const minimumFrameTime = 1000 / targetFps;
  let active = true;
  let handle = 0;
  let lastRun = 0;

  const run = (now: number) => {
    if (!active) return;
    if (now - lastRun >= minimumFrameTime) {
      lastRun = now;
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
