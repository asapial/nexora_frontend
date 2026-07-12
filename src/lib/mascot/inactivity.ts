export function remainingInactivityMs(
  lastActivityAt: number,
  now: number,
  inactivityThresholdMs: number,
): number {
  return Math.max(0, inactivityThresholdMs - (now - lastActivityAt));
}
