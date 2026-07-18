import { afterEach, describe, expect, test, vi } from "vitest";
import { startVideoFrameLoop } from "./frame-loop";

type FrameCallback = (now: number) => void;

const createScheduler = () => {
  let nextHandle = 0;
  const pending = new Map<number, FrameCallback>();
  const schedule = vi.fn((callback: FrameCallback) => {
    const handle = ++nextHandle;
    pending.set(handle, callback);
    return handle;
  });
  const cancel = vi.fn((handle: number) => {
    pending.delete(handle);
  });
  const fire = (now: number) => {
    const entry = pending.entries().next().value as [number, FrameCallback] | undefined;
    if (!entry) throw new Error("No frame is scheduled");
    const [handle, callback] = entry;
    pending.delete(handle);
    callback(now);
  };

  return { cancel, fire, pending, schedule };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("startVideoFrameLoop with requestVideoFrameCallback", () => {
  test("runs the first decoded frame even when its timestamp is zero", () => {
    const scheduler = createScheduler();
    const callback = vi.fn();
    const video = {
      currentTime: 0,
      requestVideoFrameCallback: scheduler.schedule,
      cancelVideoFrameCallback: scheduler.cancel,
    } as unknown as HTMLVideoElement;

    const stop = startVideoFrameLoop(video, callback, 30);
    scheduler.fire(0);

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(0);
    expect(scheduler.pending.size).toBe(1);
    stop();
  });

  test("throttles decoded frames to the target cadence", () => {
    const scheduler = createScheduler();
    const callback = vi.fn();
    const video = {
      currentTime: 0,
      requestVideoFrameCallback: scheduler.schedule,
      cancelVideoFrameCallback: scheduler.cancel,
    } as unknown as HTMLVideoElement;
    const stop = startVideoFrameLoop(video, callback, 30);

    scheduler.fire(0);
    scheduler.fire(20);
    scheduler.fire(1000 / 30);
    scheduler.fire(50);
    scheduler.fire(2000 / 30);

    expect(callback.mock.calls.map(([now]) => now)).toEqual([0, 1000 / 30, 2000 / 30]);
    stop();
  });

  test("cancels the latest scheduled video callback and ignores a late delivery", () => {
    const scheduler = createScheduler();
    const callback = vi.fn();
    const video = {
      currentTime: 0,
      requestVideoFrameCallback: scheduler.schedule,
      cancelVideoFrameCallback: scheduler.cancel,
    } as unknown as HTMLVideoElement;
    const stop = startVideoFrameLoop(video, callback);
    scheduler.fire(0);
    const lateCallback = scheduler.pending.values().next().value as FrameCallback;
    const latestHandle = scheduler.pending.keys().next().value as number;

    stop();
    lateCallback(40);

    expect(scheduler.cancel).toHaveBeenCalledWith(latestHandle);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(scheduler.pending.size).toBe(0);
  });
});

describe("startVideoFrameLoop with requestAnimationFrame", () => {
  test("suppresses duplicate video frames while allowing the first frame immediately", () => {
    const scheduler = createScheduler();
    vi.stubGlobal("requestAnimationFrame", scheduler.schedule);
    vi.stubGlobal("cancelAnimationFrame", scheduler.cancel);
    const callback = vi.fn();
    const video = { currentTime: 0 } as HTMLVideoElement;
    const stop = startVideoFrameLoop(video, callback, 30);

    scheduler.fire(0);
    scheduler.fire(40);
    video.currentTime = 0.04;
    scheduler.fire(50);
    video.currentTime = 0.08;
    scheduler.fire(80);

    expect(callback.mock.calls.map(([now]) => now)).toEqual([0, 50]);
    stop();
  });

  test("retains a too-early new frame until the cadence boundary", () => {
    const scheduler = createScheduler();
    vi.stubGlobal("requestAnimationFrame", scheduler.schedule);
    vi.stubGlobal("cancelAnimationFrame", scheduler.cancel);
    const callback = vi.fn();
    const video = { currentTime: 0 } as HTMLVideoElement;
    const stop = startVideoFrameLoop(video, callback, 20);

    scheduler.fire(0);
    video.currentTime = 0.01;
    scheduler.fire(10);
    scheduler.fire(50);

    expect(callback.mock.calls.map(([now]) => now)).toEqual([0, 50]);
    stop();
  });

  test("cancels the fallback animation frame and prevents work after stop", () => {
    const scheduler = createScheduler();
    vi.stubGlobal("requestAnimationFrame", scheduler.schedule);
    vi.stubGlobal("cancelAnimationFrame", scheduler.cancel);
    const callback = vi.fn();
    const video = { currentTime: 0 } as HTMLVideoElement;
    const stop = startVideoFrameLoop(video, callback);
    const lateCallback = scheduler.pending.values().next().value as FrameCallback;
    const handle = scheduler.pending.keys().next().value as number;

    stop();
    lateCallback(0);

    expect(scheduler.cancel).toHaveBeenCalledWith(handle);
    expect(callback).not.toHaveBeenCalled();
    expect(scheduler.pending.size).toBe(0);
  });
});
