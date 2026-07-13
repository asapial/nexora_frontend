import manifest from "../../../public/mascot/nimbi/manifest.json";

export interface MascotAnimationDefinition {
  column: number;
  row: number;
  frames: number;
  frameDurationMs: number;
  loop: boolean;
  nextState?: string;
  expression?: string;
}

export const NIMBI_MANIFEST = manifest as typeof manifest & {
  animations: Record<string, MascotAnimationDefinition>;
};

export function getNimbiAnimation(name: string): MascotAnimationDefinition {
  return NIMBI_MANIFEST.animations[name] ?? NIMBI_MANIFEST.animations.idle;
}
