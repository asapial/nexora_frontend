import type { MascotPreferences } from "../../types/mascot.ts";

export const MASCOT_STORAGE_KEY = "nimbi:preferences:v2";
export const MASCOT_V1_STORAGE_KEY = "nimbi:preferences:v1";
export const MASCOT_INACTIVITY_MS = 3 * 60 * 1000;
export const MASCOT_ROUTE_COOLDOWN_MS = 45_000;

export const DEFAULT_MASCOT_PREFERENCES: Readonly<MascotPreferences> = {
  enabled: true,
  speechEnabled: true,
  autoInteractionsEnabled: true,
  activityReactionsEnabled: true,
  emotionalTapReactionsEnabled: false,
  tapReactionSpeechEnabled: false,
  dragEnabled: true,
  rememberPosition: true,
  chatEnabled: true,
  ticTacToeEnabled: false,
  reducedMotionOverride: null,
  position: { side: "left", verticalRatio: 0.94 },
  defaultSide: "left",
  size: "medium",
  interactionLevel: "normal",
  emotionalIntensity: "gentle",
  learningRemindersEnabled: true,
  celebrationsEnabled: true,
  soundEnabled: false,
  compactMobile: true,
};

export const MASCOT_PRIORITY = {
  IDLE: 10, CURIOUS: 20, CLICK: 30, ENCOURAGING: 40, THINKING: 50,
  SUCCESS: 60, SAD: 65, ERROR: 70, CRYING: 75, LOGIN: 80,
  CELEBRATING: 90, CRITICAL_UI: 100,
} as const;

export const MASCOT_MESSAGES = {
  login: ["Welcome back! Ready to continue?", "Welcome back. Let’s pick up where you left off."],
  greeting: ["Good to see you.", "Ready when you are."],
  success: ["Nicely done!", "That worked perfectly."],
  error: ["That did not work. Please try again.", "Something got in the way. We can retry."],
  encouraging: ["One step at a time.", "You are getting closer."],
  celebrating: ["Great work. That is complete!", "You did it!"],
  click: ["How can I help?", "I’m here when you need me."],
  dizzy: ["Let’s get our bearings.", "One moment, please."],
  sad: ["We can take a calm look at this."],
  recovering: ["Ready again.", "Let’s continue."],
  chat: ["I am listening.", "Let's figure it out together."],
  gameUserWon: ["That was a brilliant move!", "You got me this time."],
  gameMascotWon: ["My antennas found the winning path!", "Good game. That was close."],
  gameDraw: ["We are evenly matched.", "Another round?"],
} as const;

export const SENSITIVE_MASCOT_PATHS = [
  "/payment", "/checkout",
  "/dashboard/student/exams/", "/dashboard/student/resource-annotation",
] as const;
