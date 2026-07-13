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
  emotionalTapReactionsEnabled: true,
  tapReactionSpeechEnabled: true,
  dragEnabled: true,
  rememberPosition: true,
  chatEnabled: true,
  ticTacToeEnabled: true,
  reducedMotionOverride: null,
  position: { side: "right", verticalRatio: 0.82 },
  defaultSide: "right",
  size: "medium",
  interactionLevel: "normal",
  emotionalIntensity: "gentle",
};

export const MASCOT_PRIORITY = {
  IDLE: 10, CURIOUS: 20, CLICK: 30, ENCOURAGING: 40, THINKING: 50,
  SUCCESS: 60, SAD: 65, ERROR: 70, CRYING: 75, LOGIN: 80,
  CELEBRATING: 90, CRITICAL_UI: 100,
} as const;

export const MASCOT_MESSAGES = {
  login: ["Welcome back! Ready for another adventure?", "You are back! Let's make today sparkle."],
  greeting: ["Good to see you.", "Ready when you are."],
  success: ["Nicely done!", "That worked perfectly."],
  error: ["A wire got confused. We can recover.", "That did not work. Let's try again."],
  encouraging: ["One step at a time.", "You are getting closer."],
  celebrating: ["That deserves a celebration!", "You did it!"],
  click: ["That tickles!", "Hello from this corner."],
  dizzy: ["My antennas are spinning.", "Tiny bonk detected!"],
  sad: ["I need a tiny recovery moment."],
  recovering: ["Okay, I'm back!", "Systems cheerful again."],
  chat: ["I am listening.", "Let's figure it out together."],
  gameUserWon: ["That was a brilliant move!", "You got me this time."],
  gameMascotWon: ["My antennas found the winning path!", "Good game. That was close."],
  gameDraw: ["We are evenly matched.", "Another round?"],
} as const;

export const SENSITIVE_MASCOT_PATHS = [
  "/auth/", "/courses/enroll", "/payment", "/checkout",
  "/dashboard/student/exams/", "/dashboard/student/resource-annotation",
] as const;
