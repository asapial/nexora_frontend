import type { MascotEventMap } from "../../types/mascot.ts";

type MascotEventName = keyof MascotEventMap;
type MascotListener<K extends MascotEventName> = (
  payload: MascotEventMap[K],
) => void;
type PayloadArguments<K extends MascotEventName> =
  MascotEventMap[K] extends undefined ? [] : [payload: MascotEventMap[K]];

const listeners = new Map<MascotEventName, Set<(payload: unknown) => void>>();

export function emitMascotEvent<K extends MascotEventName>(
  eventName: K,
  ...args: PayloadArguments<K>
): void {
  if (isMascotSuppressed()) return;
  const eventListeners = listeners.get(eventName);
  if (!eventListeners) return;
  const payload = args[0] as MascotEventMap[K];
  eventListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[Nimbi] A ${eventName} listener failed.`, error);
      }
    }
  });
}

export function subscribeToMascotEvent<K extends MascotEventName>(
  eventName: K,
  listener: MascotListener<K>,
): () => void {
  const eventListeners = listeners.get(eventName) ?? new Set();
  eventListeners.add(listener as (payload: unknown) => void);
  listeners.set(eventName, eventListeners);
  return () => unsubscribeFromMascotEvent(eventName, listener);
}

export function unsubscribeFromMascotEvent<K extends MascotEventName>(
  eventName: K,
  listener: MascotListener<K>,
): void {
  const eventListeners = listeners.get(eventName);
  eventListeners?.delete(listener as (payload: unknown) => void);
  if (eventListeners?.size === 0) listeners.delete(eventName);
}

let suppressionCount = 0;
const suppressionListeners = new Set<() => void>();

export function suppressMascot(): () => void {
  suppressionCount += 1;
  suppressionListeners.forEach((listener) => listener());
  let resumed = false;
  return () => {
    if (resumed) return;
    resumed = true;
    resumeMascot();
  };
}

export function resumeMascot(): void {
  suppressionCount = Math.max(0, suppressionCount - 1);
  suppressionListeners.forEach((listener) => listener());
}

export function isMascotSuppressed(): boolean {
  return suppressionCount > 0;
}

export function subscribeToMascotSuppression(listener: () => void): () => void {
  suppressionListeners.add(listener);
  return () => suppressionListeners.delete(listener);
}
