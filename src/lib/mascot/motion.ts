export function resolveReducedMotion(
  systemPreference: boolean,
  override: boolean | null,
): boolean {
  return override ?? systemPreference;
}
