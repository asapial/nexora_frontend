export type ProctorDeliveryOptions = {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
  onRetry?: (error: unknown, nextAttempt: number, delayMs: number) => void;
};

export type ProctorDeliveryResult = {
  attempts: number;
};

const defaultSleep = (delayMs: number) => new Promise<void>((resolve) => {
  globalThis.setTimeout(resolve, delayMs);
});

/**
 * Delivers one immutable, idempotent proctor payload with bounded backoff.
 * The caller creates clientEventId once; every retry sends the same object.
 */
export async function deliverProctorEvent<T>(
  payload: T,
  send: (stablePayload: T) => Promise<unknown>,
  options: ProctorDeliveryOptions = {},
): Promise<ProctorDeliveryResult> {
  const maxAttempts = Math.max(1, Math.trunc(options.maxAttempts ?? 4));
  const initialDelayMs = Math.max(0, options.initialDelayMs ?? 450);
  const maxDelayMs = Math.max(initialDelayMs, options.maxDelayMs ?? 3_000);
  const sleep = options.sleep ?? defaultSleep;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await send(payload);
      return { attempts: attempt };
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      const delayMs = Math.min(maxDelayMs, initialDelayMs * 2 ** (attempt - 1));
      options.onRetry?.(error, attempt + 1, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Proctor event delivery failed");
}
