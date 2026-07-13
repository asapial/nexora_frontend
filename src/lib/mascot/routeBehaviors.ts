import type { MascotReactionId } from "./reactions";

export interface MascotRouteBehavior {
  id: string;
  reaction: MascotReactionId;
  message?: string;
}

const ROUTE_BEHAVIORS: readonly {
  matches: (pathname: string) => boolean;
  behavior: MascotRouteBehavior;
}[] = [
  { matches: (path) => path === "/", behavior: { id: "home", reaction: "waving", message: "Welcome to Nexora. Explore when you’re ready." } },
  { matches: (path) => path === "/courses", behavior: { id: "course-catalog", reaction: "searching", message: "Let’s find a course that fits your goal." } },
  { matches: (path) => /^\/courses\/[^/]+$/.test(path), behavior: { id: "course-detail", reaction: "reading" } },
  { matches: (path) => path.includes("/enroll"), behavior: { id: "enrollment", reaction: "waiting", message: "Take your time. Review the details before continuing." } },
  { matches: (path) => path === "/pricing", behavior: { id: "pricing", reaction: "reviewing" } },
  { matches: (path) => path === "/about", behavior: { id: "about", reaction: "reading" } },
  { matches: (path) => path === "/contact", behavior: { id: "contact", reaction: "writing" } },
  { matches: (path) => path.includes("/auth/signin"), behavior: { id: "sign-in", reaction: "waving", message: "Welcome back. Sign in when you’re ready." } },
  { matches: (path) => path.includes("/auth/signup"), behavior: { id: "sign-up", reaction: "encouraging", message: "A few details, then your learning space is ready." } },
  { matches: (path) => path.includes("/auth/verifyEmail"), behavior: { id: "verify-email", reaction: "waiting" } },
  { matches: (path) => path.includes("/auth/forgetPassword") || path.includes("/auth/resetPassword"), behavior: { id: "password-recovery", reaction: "waiting" } },
  { matches: (path) => path === "/dashboard", behavior: { id: "dashboard", reaction: "waving" } },
  { matches: (path) => path.includes("/student/courses/") , behavior: { id: "student-course", reaction: "reading", message: "Focus mode is ready. One mission at a time." } },
  { matches: (path) => path.includes("/student/homework") || path.includes("/student/taskSubmission"), behavior: { id: "student-homework", reaction: "writing" } },
  { matches: (path) => path.includes("/student/study-planner"), behavior: { id: "study-planner", reaction: "reviewing", message: "Choose one useful next step for today." } },
  { matches: (path) => path.includes("/student/resources/upload") || path.includes("/teacher/resource/upload"), behavior: { id: "resource-upload", reaction: "uploading" } },
  { matches: (path) => path.includes("/resources") || path.includes("/resource/"), behavior: { id: "resources", reaction: "searching" } },
  { matches: (path) => path.endsWith("/notice"), behavior: { id: "notices", reaction: "notice" } },
  { matches: (path) => path.includes("/teacher/courses/create") || (path.includes("/teacher/courses/") && path.endsWith("/edit")), behavior: { id: "teacher-course-editor", reaction: "writing" } },
  { matches: (path) => path.includes("/teacher/taskSubmission/"), behavior: { id: "teacher-review", reaction: "reviewing", message: "Review mode is ready." } },
  { matches: (path) => path.includes("/admin/approvals") || path.includes("/admin/teacher-requests"), behavior: { id: "admin-approvals", reaction: "reviewing", message: "Review the evidence, then choose the next action." } },
  { matches: (path) => path.includes("/admin/content-moderation"), behavior: { id: "moderation", reaction: "warning" } },
  { matches: (path) => path.includes("/analytics") || path.includes("/progress"), behavior: { id: "analytics", reaction: "reviewing" } },
];

export function getMascotRouteBehavior(pathname: string): MascotRouteBehavior | undefined {
  return ROUTE_BEHAVIORS.find(({ matches }) => matches(pathname))?.behavior;
}
