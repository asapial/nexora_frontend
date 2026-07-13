import type { MascotEventMap, MascotSuppressionOptions } from "../../types/mascot.ts";

type MascotEventName = keyof MascotEventMap;
type MascotListener<K extends MascotEventName> = (payload: MascotEventMap[K]) => void;
type PayloadArguments<K extends MascotEventName> = undefined extends MascotEventMap[K]
  ? [] | [payload: Exclude<MascotEventMap[K], undefined>]
  : [payload: MascotEventMap[K]];
const listeners = new Map<MascotEventName, Set<(payload: unknown) => void>>();

export function emitMascotEvent<K extends MascotEventName>(eventName: K, ...args: PayloadArguments<K>): void {
  if (getMascotSuppression().hidden) return;
  const eventListeners = listeners.get(eventName);
  if (!eventListeners) return;
  eventListeners.forEach((listener) => {
    try { listener(args[0] as MascotEventMap[K]); }
    catch (error) { if (process.env.NODE_ENV === "development") console.warn(`[Nimbi] A ${eventName} listener failed.`, error); }
  });
}

export function subscribeToMascotEvent<K extends MascotEventName>(eventName: K, listener: MascotListener<K>): () => void {
  const eventListeners = listeners.get(eventName) ?? new Set();
  eventListeners.add(listener as (payload: unknown) => void);
  listeners.set(eventName, eventListeners);
  return () => {
    eventListeners.delete(listener as (payload: unknown) => void);
    if (eventListeners.size === 0) listeners.delete(eventName);
  };
}
export function unsubscribeFromMascotEvent<K extends MascotEventName>(eventName: K, listener: MascotListener<K>): void {
  const eventListeners = listeners.get(eventName);
  eventListeners?.delete(listener as (payload: unknown) => void);
  if (eventListeners?.size === 0) listeners.delete(eventName);
}

const suppressions = new Map<number, Required<Pick<MascotSuppressionOptions, "hide" | "speech">>>();
const suppressionListeners = new Set<() => void>();
let suppressionId = 0;
let suppressionSnapshot = { hidden: false, speech: false };

function updateSuppressionSnapshot(): void {
  suppressionSnapshot = {
    hidden: [...suppressions.values()].some((item) => item.hide),
    speech: [...suppressions.values()].some((item) => item.speech),
  };
  suppressionListeners.forEach((listener) => listener());
}

export function suppressMascot(options: MascotSuppressionOptions = { hide: true }): () => void {
  const id = ++suppressionId;
  suppressions.set(id, { hide: options.hide ?? true, speech: options.speech ?? false });
  updateSuppressionSnapshot();
  let released = false;
  return () => { if (released) return; released = true; suppressions.delete(id); updateSuppressionSnapshot(); };
}

export function resumeMascot(): void {
  const last = [...suppressions.keys()].at(-1);
  if (last !== undefined) { suppressions.delete(last); updateSuppressionSnapshot(); }
}
export const getMascotSuppression = () => suppressionSnapshot;
export const isMascotSuppressed = () => suppressionSnapshot.hidden;
export function subscribeToMascotSuppression(listener: () => void): () => void { suppressionListeners.add(listener); return () => suppressionListeners.delete(listener); }

export function resetMascotSuppressionForTests(): void { suppressions.clear(); updateSuppressionSnapshot(); }
