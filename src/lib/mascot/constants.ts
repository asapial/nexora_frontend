import type { MascotPreferences } from "../../types/mascot.ts";

export const MASCOT_STORAGE_KEY = "nimbi:preferences:v1";
export const MASCOT_INACTIVITY_MS = 3 * 60 * 1000;
export const MASCOT_CLICK_COOLDOWN_MS = 3000;

export const DEFAULT_MASCOT_PREFERENCES: Readonly<MascotPreferences> = {
  enabled: true,
  reducedMotionOverride: null,
  position: "bottom-right",
  interactionLevel: "normal",
  speechEnabled: true,
};

export const MASCOT_PRIORITY = {
  IDLE: 10,
  CURIOUS: 20,
  ENCOURAGING: 40,
  THINKING: 50,
  SUCCESS: 60,
  ERROR: 70,
  CELEBRATING: 90,
} as const;

export const MASCOT_MESSAGES = {
  greeting: [
    "Good to see you.",
    "Ready when you are.",
    "Let’s make something great.",
  ],
  success: [
    "Nicely done.",
    "That worked perfectly.",
    "Progress looks good.",
  ],
  error: [
    "That did not work. Let’s try again.",
    "Something went wrong, but we can recover.",
    "I think one of the wires got confused.",
  ],
  encouraging: [
    "You are getting closer.",
    "One step at a time.",
    "Let’s give it another try.",
  ],
  celebrating: [
    "Achievement unlocked!",
    "That deserves a celebration.",
    "You did it!",
  ],
  click: [
    "That tickles.",
    "I was not expecting that.",
    "Hello from this corner.",
    "I am still awake.",
  ],
} as const;

export const SENSITIVE_MASCOT_PATHS = [
  "/auth/",
  "/courses/enroll",
  "/payment",
  "/dashboard/student/exams/",
  "/dashboard/student/resource-annotation",
] as const;
