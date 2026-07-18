import { describe, expect, it, vi } from "vitest";
import { deliverProctorEvent } from "./delivery";

describe("deliverProctorEvent", () => {
  it("sends once when delivery succeeds", async () => {
    const payload = { clientEventId: "event-1", type: "PHONE_DETECTED" };
    const send = vi.fn().mockResolvedValue({ success: true });

    await expect(deliverProctorEvent(payload, send)).resolves.toEqual({ attempts: 1 });
    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith(payload);
  });

  it("retries with the exact same idempotent payload and bounded backoff", async () => {
    const payload = { clientEventId: "stable-event-id", type: "DEVICE_DETECTED" };
    const send = vi.fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockRejectedValueOnce(new Error("gateway timeout"))
      .mockResolvedValue({ success: true });
    const sleep = vi.fn().mockResolvedValue(undefined);
    const onRetry = vi.fn();

    await expect(deliverProctorEvent(payload, send, {
      initialDelayMs: 500,
      maxDelayMs: 750,
      sleep,
      onRetry,
    })).resolves.toEqual({ attempts: 3 });

    expect(send.mock.calls.map(([sent]) => sent)).toEqual([payload, payload, payload]);
    expect(sleep.mock.calls).toEqual([[500], [750]]);
    expect(onRetry.mock.calls.map(([, attempt, delay]) => [attempt, delay])).toEqual([
      [2, 500],
      [3, 750],
    ]);
  });

  it("stops after the configured attempt limit and returns the last error", async () => {
    const first = new Error("first");
    const last = new Error("last");
    const send = vi.fn().mockRejectedValueOnce(first).mockRejectedValue(last);

    await expect(deliverProctorEvent({ clientEventId: "event-2" }, send, {
      maxAttempts: 2,
      sleep: async () => undefined,
    })).rejects.toBe(last);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
