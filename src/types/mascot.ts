export type MascotState =
  | "idle" | "greeting" | "happy" | "excited" | "thinking" | "success"
  | "error" | "curious" | "encouraging" | "celebrating" | "surprised"
  | "tickled" | "dizzy" | "sad" | "crying" | "recovering" | "sleeping"
  | "chatting" | "gaming" | "dragging" | "hidden";

export type MascotPanel = "closed" | "actions" | "chat" | "tic-tac-toe" | "quick-settings";
export type MascotEmotion = "neutral" | "joyful" | "playful" | "focused" | "concerned" | "sad" | "sleepy";

export interface MascotPosition {
  side: "left" | "right";
  verticalRatio: number;
}

export interface MascotEventMap {
  app_ready: undefined;
  user_logged_in: { displayName?: string };
  user_logged_out: undefined;
  route_changed: { pathname: string };
  loading_started: { label?: string; operationId?: string };
  loading_finished: { operationId?: string } | undefined;
  action_success: { message?: string };
  action_error: { message?: string };
  task_completed: { taskName?: string; progress?: number };
  achievement_unlocked: { title: string };
  user_inactive: { durationMs: number };
  user_returned: undefined;
  mascot_clicked: undefined;
  mascot_double_tapped: undefined;
  mascot_hit: { intensity: "light" | "medium" | "repeated" };
  mascot_drag_started: undefined;
  mascot_drag_ended: { side: "left" | "right" };
  chat_opened: undefined;
  chat_message_sent: undefined;
  chat_response_started: undefined;
  chat_response_finished: undefined;
  chat_error: { message?: string };
  game_started: undefined;
  game_move_completed: { player: "user" | "mascot" };
  game_finished: { result: "user-won" | "mascot-won" | "draw" };
}

export interface MascotPreferences {
  enabled: boolean;
  speechEnabled: boolean;
  autoInteractionsEnabled: boolean;
  activityReactionsEnabled: boolean;
  emotionalTapReactionsEnabled: boolean;
  tapReactionSpeechEnabled: boolean;
  dragEnabled: boolean;
  rememberPosition: boolean;
  chatEnabled: boolean;
  ticTacToeEnabled: boolean;
  reducedMotionOverride: boolean | null;
  position: MascotPosition;
  defaultSide: "left" | "right";
  size: "small" | "medium" | "large";
  interactionLevel: "quiet" | "normal" | "playful";
  emotionalIntensity: "gentle" | "expressive";
}

export interface MascotReaction {
  id: string;
  state: MascotState;
  emotion: MascotEmotion;
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

export interface MascotSuppressionOptions {
  hide?: boolean;
  speech?: boolean;
  reason?: string;
}
