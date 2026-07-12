export type MascotState =
  | "idle"
  | "greeting"
  | "thinking"
  | "success"
  | "error"
  | "curious"
  | "encouraging"
  | "celebrating"
  | "sleeping"
  | "hidden";

export interface MascotEventMap {
  app_ready: undefined;
  loading_started: { label?: string };
  loading_finished: undefined;
  action_success: { message?: string };
  action_error: { message?: string };
  task_completed: { taskName?: string; progress?: number };
  achievement_unlocked: { title: string };
  user_inactive: { durationMs: number };
  user_returned: undefined;
  mascot_clicked: undefined;
}

export interface MascotPreferences {
  enabled: boolean;
  reducedMotionOverride: boolean | null;
  position: "bottom-left" | "bottom-right";
  interactionLevel: "quiet" | "normal" | "playful";
  speechEnabled: boolean;
}

export interface MascotReaction {
  id: string;
  state: MascotState;
  priority: number;
  durationMs: number;
  cooldownMs: number;
  messages: readonly string[];
  speechChance: number;
  interruptible: boolean;
}

export interface MascotSpeech {
  id: number;
  message: string;
  meaningful: boolean;
  durationMs: number;
}
