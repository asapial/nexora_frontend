// ─── Core fetch wrapper ───────────────────────────────────
import { emitMascotEvent } from "@/lib/mascot/eventBus";
import type { ProctorEventPage } from "@/lib/examshield-live";

type ApiErrorSource = {
  path?: string;
  message?: string;
};

interface ApiFetchOptions extends RequestInit {
  petAction?: string;
  petState?: "thinking" | "reading" | "writing" | "searching" | "uploading" | "waiting" | "reviewing";
  petSuccessLevel?: "none" | "minor" | "major";
  petSuccessMessage?: string;
  petErrorMessage?: string;
  petTaskName?: string;
}

async function apiFetch<T>(url: string, options: ApiFetchOptions = {}): Promise<{ success: boolean; data: T; message: string; }> {
  const {
    petAction,
    petState,
    petSuccessLevel = "none",
    petSuccessMessage,
    petErrorMessage,
    petTaskName,
    ...requestOptions
  } = options;
  const operationId = petAction
    ? `pet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    : undefined;
  let activityShown = false;
  const activityTimer = petAction
    ? globalThis.setTimeout(() => {
        activityShown = true;
        emitMascotEvent("loading_started", { label: petAction, operationId, state: petState });
      }, 650)
    : undefined;

  try {
    const res = await fetch(url, {
      credentials: "include",
      ...requestOptions,
      headers: { "Content-Type": "application/json", ...requestOptions.headers },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const validationMessage = Array.isArray(json.errorSources)
        ? json.errorSources
          .filter((source: ApiErrorSource) => source?.message)
          .map((source: ApiErrorSource) => `${source.path ? `${source.path}: ` : ""}${source.message}`)
          .join("; ")
        : "";
      throw new Error(validationMessage || json.message || "Request failed");
    }
    if (petSuccessLevel === "major") {
      emitMascotEvent("task_completed", {
        taskName: petTaskName ?? petSuccessMessage ?? "Action",
      });
    } else if (petSuccessLevel === "minor") {
      emitMascotEvent("action_success", { message: petSuccessMessage });
    }
    return json;
  } catch (error) {
    if (petAction) {
      emitMascotEvent("action_error", {
        message: petErrorMessage ?? "The request could not be completed. Please try again.",
      });
    }
    if (error instanceof TypeError) emitMascotEvent("network_offline");
    throw error;
  } finally {
    if (activityTimer !== undefined) globalThis.clearTimeout(activityTimer);
    if (activityShown) emitMascotEvent("loading_finished", { operationId });
  }
}
function qs(params?: Record<string, string | number | undefined>): string {
  if (!params) return "";
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") p.set(k, String(v)); });
  const s = p.toString(); return s ? `?${s}` : "";
}

// ─── Teacher API ──────────────────────────────────────────
const T = "/api";
export const courseApi = {
  list: () => apiFetch<any[]>(`${T}/courses`),
  get: (id: string) => apiFetch<any>(`${T}/courses/${id}`),
  create: (body: any) => apiFetch<any>(`${T}/courses`, { method: "POST", body: JSON.stringify(body), petAction: "Saving your course draft", petState: "writing", petSuccessLevel: "minor", petSuccessMessage: "Course draft saved." }),
  update: (id: string, body: any) => apiFetch<any>(`${T}/courses/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch<any>(`${T}/courses/${id}`, { method: "DELETE" }),
  submit: (id: string) => apiFetch<any>(`${T}/courses/${id}/submit`, { method: "POST", petAction: "Submitting your course for review", petState: "uploading", petSuccessLevel: "minor", petSuccessMessage: "Course submitted for review." }),
  close: (id: string) => apiFetch<any>(`${T}/courses/${id}/close`, { method: "POST" }),
  finish: (id: string) => apiFetch<any>(`${T}/courses/${id}/finish`, { method: "POST" }),
  getMissions: (courseId: string) => apiFetch<any[]>(`${T}/courses/${courseId}/missions`),
  createMission: (courseId: string, body: any) => apiFetch<any>(`${T}/courses/${courseId}/missions`, { method: "POST", body: JSON.stringify(body) }),
  updateMission: (cId: string, mId: string, body: any) => apiFetch<any>(`${T}/courses/${cId}/missions/${mId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteMission: (cId: string, mId: string) => apiFetch<any>(`${T}/courses/${cId}/missions/${mId}`, { method: "DELETE" }),
  submitMission: (cId: string, mId: string) => apiFetch<any>(`${T}/courses/${cId}/missions/${mId}/submit`, { method: "POST" }),
  getContents: (missionId: string) => apiFetch<any[]>(`${T}/missions/${missionId}/contents`),
  createContent: (mId: string, body: any) => apiFetch<any>(`${T}/missions/${mId}/contents`, { method: "POST", body: JSON.stringify(body) }),
  deleteContent: (mId: string, cId: string) => apiFetch<any>(`${T}/missions/${mId}/contents/${cId}`, { method: "DELETE" }),
  reorderContents: (mId: string, orderedIds: string[]) => apiFetch<any>(`${T}/missions/${mId}/contents/reorder`, { method: "PATCH", body: JSON.stringify({ orderedIds }) }),
  getPriceRequests: (courseId: string) => apiFetch<any[]>(`${T}/courses/${courseId}/price-requests`),
  createPriceRequest: (courseId: string, body: any) => apiFetch<any>(`${T}/courses/${courseId}/price-request`, { method: "POST", body: JSON.stringify(body) }),
  getEnrollments: (courseId: string, params?: Record<string, string>) => apiFetch<any>(`${T}/courses/${courseId}/enrollments${qs(params)}`),
  getEnrollmentStats: (courseId: string) => apiFetch<any>(`${T}/courses/${courseId}/enrollments/stats`),
  getEarnings: () => apiFetch<any>(`${T}/teacher/earnings`),
  getTransactions: (params?: Record<string, string>) => apiFetch<any>(`${T}/teacher/earnings/transactions${qs(params)}`),
};

// ─── Admin API ────────────────────────────────────────────
const A = "/api/admin";
export const adminApi = {
  getPendingCourses: (p?: any) => apiFetch<any>(`${A}/courses${qs({ status: "PENDING_APPROVAL", ...p })}`),
  getAllCourses: (p?: any) => apiFetch<any>(`${A}/courses${qs(p)}`),
  getCourse: (id: string) => apiFetch<any>(`${A}/courses/${id}`),
  approveCourse: (id: string) => apiFetch<any>(`${A}/courses/${id}/approve`, { method: "POST", petAction: "Reviewing the approval", petState: "reviewing", petSuccessLevel: "major", petTaskName: "Course approval" }),
  rejectCourse: (id: string, note: string) => apiFetch<any>(`${A}/courses/${id}/reject`, { method: "POST", body: JSON.stringify({ note }), petAction: "Filing the review notes", petState: "reviewing", petSuccessLevel: "minor", petSuccessMessage: "Review notes saved." }),
  deleteCourse: (id: string) => apiFetch<any>(`${A}/courses/${id}`, { method: "DELETE" }),
  toggleFeatured: (id: string) => apiFetch<any>(`${A}/courses/${id}/feature`, { method: "POST" }),
  setRevenuePercent: (id: string, percent: number) => apiFetch<any>(`${A}/courses/${id}/revenue-percent`, { method: "PATCH", body: JSON.stringify({ percent }) }),
  getPendingMissions: (p?: any) => apiFetch<any>(`${A}/missions${qs({ status: "PENDING_APPROVAL", ...p })}`),
  approveMission: (id: string) => apiFetch<any>(`${A}/missions/${id}/approve`, { method: "POST" }),
  rejectMission: (id: string, note: string) => apiFetch<any>(`${A}/missions/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
  getPendingPriceReqs: (p?: any) => apiFetch<any>(`${A}/price-requests${qs(p)}`),
  approvePriceRequest: (id: string, price: number) => apiFetch<any>(`${A}/price-requests/${id}/approve`, { method: "POST", body: JSON.stringify({ price }) }),
  rejectPriceRequest: (id: string, note: string) => apiFetch<any>(`${A}/price-requests/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
  getAllEnrollments: (p?: any) => apiFetch<any>(`${A}/enrollments${qs(p)}`),
  getRevenue: () => apiFetch<any>(`${A}/revenue`),
  getRevenueTransactions: (p?: any) => apiFetch<any>(`${A}/revenue/transactions${qs(p)}`),
  createTeachersByEmails: (emails: string[]) =>
    apiFetch<{
      newAccountsCreated: string[];
      existingUpgraded: string[];
      alreadyRegisteredAsTeacher: string[];
    }>(`${A}/createTeacher`, { method: "POST", body: JSON.stringify({ emails }) }),
  createAdminsByEmails: (emails: string[]) =>
    apiFetch<{
      newAccountsCreated: string[];
      existingUpgraded: string[];
      alreadyRegisteredAsAdmin: string[];
    }>(`${A}/createAdmin`, { method: "POST", body: JSON.stringify({ emails }) }),
};

// ─── Student / Public API ─────────────────────────────────
const S = "/api/student";
export const studentApi = {
  getCatalog: (p?: any) => apiFetch<any>(`/api/courses/public${qs(p)}`),
  getCoursePublic: (id: string) => apiFetch<any>(`/api/courses/${id}/public`),
  freeEnroll: (courseId: string) => apiFetch<any>(`/api/payments/enroll/${courseId}`, { method: "POST", body: JSON.stringify({}) }),
  getMyEnrollments: (p?: any) => apiFetch<any>(`${S}/enrollments${qs(p)}`),
  getMyEnrollment: (courseId: string) => apiFetch<any>(`${S}/enrollments/${courseId}`),
  completeMission: (courseId: string, missionId: string) => apiFetch<any>(`${S}/enrollments/${courseId}/missions/${missionId}/complete`, { method: "POST", petAction: "Completing this mission", petState: "reading", petSuccessLevel: "major", petTaskName: "Mission" }),
  getMissionContents: (missionId: string) => apiFetch<any[]>(`${S}/missions/${missionId}/contents`),
  /** Paid course purchases (Stripe) — not free enrollments. */
  getPaymentHistory: () =>
    apiFetch<{
      summary: {
        totalPaidUsd: number;
        totalAttempts: number;
        paidCount: number;
        pendingCount: number;
        failedCount: number;
        refundedCount: number;
      };
      payments: Array<{
        id: string;
        courseId: string;
        courseTitle: string;
        amount: number;
        currency: string;
        status: string;
        stripePaymentIntentId: string;
        paidAt: string | null;
        failedAt: string | null;
        createdAt: string;
      }>;
    }>("/api/payments/history"),
};

export const examApi = {
  teacherList: () => apiFetch<any[]>("/api/exams/teacher"),
  teacherDetail: (id: string) => apiFetch<any>(`/api/exams/teacher/${id}`),
  teacherProctorEvents: (id: string, cursor?: string, limit = 50) =>
    apiFetch<ProctorEventPage>(`/api/exams/teacher/${id}/proctor-events${qs({ cursor, limit })}`),
  proctorSocketTicket: (id: string) => apiFetch<{ socketUrl: string; expiresInSeconds: number; }>(`/api/exams/teacher/${id}/proctor-socket-ticket`, { method: "POST" }),
  create: (body: any) => apiFetch<any>("/api/exams/teacher", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/exams/teacher/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  setQuestions: (id: string, questions: any[]) => apiFetch<any>(`/api/exams/teacher/${id}/questions`, { method: "PUT", body: JSON.stringify({ questions }) }),
  gradeAttempt: (id: string, attemptId: string, grades: any[]) => apiFetch<any>(`/api/exams/teacher/${id}/attempts/${attemptId}/grade`, { method: "PATCH", body: JSON.stringify({ grades }) }),
  publishResults: (id: string, body: { resultsPublished?: boolean; answerSheetPublished?: boolean; }) => apiFetch<any>(`/api/exams/teacher/${id}/publication`, { method: "PATCH", body: JSON.stringify(body) }),
  emailResults: (id: string) => apiFetch<any>(`/api/exams/teacher/${id}/email-results`, { method: "POST" }),
  emailStudentResult: (id: string, attemptId: string) => apiFetch<any>(`/api/exams/teacher/${id}/email-result`, { method: "POST", body: JSON.stringify({ attemptId }) }),
  pending: () => apiFetch<any[]>("/api/exams/admin/pending"),
  analytics: () => apiFetch<any>("/api/exams/admin/analytics"),
  approve: (id: string) => apiFetch<any>(`/api/exams/admin/${id}/approve`, { method: "POST" }),
  reject: (id: string, reason: string) => apiFetch<any>(`/api/exams/admin/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  studentList: () => apiFetch<any[]>("/api/exams/student"),
  studentAccess: (id: string) => apiFetch<any>(`/api/exams/student/${id}/access`),
  proctorPreflight: (id: string, body: any) => apiFetch<any>(`/api/exams/student/${id}/proctor-preflight`, { method: "POST", body: JSON.stringify(body) }),
  start: (id: string, preflightToken?: string) => apiFetch<any>(`/api/exams/student/${id}/start`, { method: "POST", body: JSON.stringify({ preflightToken }) }),
  submit: (id: string, answers: any[], autoSubmit = false) => apiFetch<any>(`/api/exams/student/${id}/submit`, { method: "POST", body: JSON.stringify({ answers, autoSubmit }) }),
  violation: (id: string, body: any) => apiFetch<any>(`/api/exams/student/${id}/violations`, { method: "POST", body: JSON.stringify(body) }),
  reviewProctorEvent: (id: string, eventId: string, body: { decision: "DISMISSED" | "CONFIRMED_CONCERN" | "NEEDS_FOLLOW_UP"; note?: string; }) => apiFetch<any>(`/api/exams/teacher/${id}/proctor-events/${eventId}/review`, { method: "PATCH", body: JSON.stringify(body) }),
  clearProctorFeed: (id: string, attemptId: string) => apiFetch<any>(`/api/exams/teacher/${id}/proctor-feed/clear`, { method: "POST", body: JSON.stringify({ attemptId }) }),
  result: (id: string) => apiFetch<any>(`/api/exams/student/${id}/result`),
};

export const notificationApi = {
  list: (params?: { type?: string; unread?: "true" | "false"; limit?: number }) => apiFetch<{
    notifications: Array<{
      id: string;
      userId: string;
      type: string;
      title: string;
      body: string | null;
      isRead: boolean;
      link: string | null;
      createdAt: string;
    }>;
    unreadCount: number;
  }>(`/api/notifications${qs(params)}`),
  markRead: (id: string) => apiFetch<any>(`/api/notifications/${id}/read`, { method: "PATCH" }),
};

export const settingsApi = {
  getAccount: () => apiFetch<any>("/api/settings/account"),
  updateAccount: (body: Record<string, unknown>) =>
    apiFetch<any>("/api/settings/account", { method: "PATCH", body: JSON.stringify(body) }),
  // Password change — uses existing auth route
  changePassword: (oldPassword: string, newPassword: string) =>
    apiFetch<any>("/api/auth/changePassword", { method: "POST", body: JSON.stringify({ oldPassword, newPassword }) }),
  // Sessions
  getSessions: () => apiFetch<any>("/api/settings/sessions"),
  revokeSession: (sessionId: string) =>
    apiFetch<any>(`/api/settings/sessions/${sessionId}/revoke`, { method: "POST" }),
  revokeAllSessions: () =>
    apiFetch<any>("/api/settings/sessions/revoke-all", { method: "POST" }),
  // Danger zone
  deactivateAccount: () =>
    apiFetch<any>("/api/settings/deactivate", { method: "POST" }),
  deleteAccount: (confirmText: string) =>
    apiFetch<any>("/api/settings/delete-account", { method: "POST", body: JSON.stringify({ confirmText }) }),
  exportData: () =>
    apiFetch<any>("/api/settings/export-data", { method: "POST" }),
  // PDF export — streams binary
  exportDataPDF: async () => {
    const res = await fetch("/api/settings/export-data-pdf", { credentials: "include" });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message ?? "PDF export failed");
    }
    return res.blob();
  },
  // Two-Factor Authentication
  getTwoFactorStatus: () =>
    apiFetch<{ twoFactorEnabled: boolean; }>("/api/settings/two-factor-status"),
  enableTwoFactor: async (password: string) => {
    const res = await apiFetch<any>("/api/settings/two-factor/enable", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    return res.data ?? res;
  },
  verifyTwoFactor: async (code: string) => {
    const res = await apiFetch<any>("/api/settings/two-factor/verify-totp", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    return res.data ?? res;
  },
  disableTwoFactor: async (password: string) => {
    const res = await apiFetch<any>("/api/settings/two-factor/disable", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    return res.data ?? res;
  },
  // API Key management
  getApiKeys: () =>
    apiFetch<any[]>("/api/settings/api-keys"),
  generateApiKey: (label: string) =>
    apiFetch<any>("/api/settings/api-keys", { method: "POST", body: JSON.stringify({ label }) }),
  deleteApiKey: (keyId: string) =>
    apiFetch<any>(`/api/settings/api-keys/${keyId}`, { method: "DELETE" }),
  revokeAllApiKeys: () =>
    apiFetch<any>("/api/settings/api-keys/revoke-all", { method: "POST" }),
};

// ─── Stripe / Payment API ─────────────────────────────────
export const paymentApi = {
  createIntent: (courseId: string) =>
    apiFetch<{
      clientSecret: string;
      paymentId: string;
      paymentIntentId: string;
      amount: number;
    }>("/api/payments/create-intent", {
      method: "POST",
      body: JSON.stringify({ courseId }),
    }),
  /** Call after stripe.confirmPayment succeeds (needed when Stripe webhooks do not hit your server). */
  confirmPayment: (paymentIntentId: string) =>
    apiFetch<{ enrollmentId: string | null; alreadyFinalized?: boolean; }>("/api/payments/confirm", {
      method: "POST",
      body: JSON.stringify({ paymentIntentId }),
    }),
  getStatus: (courseId: string) =>
    apiFetch<{ status: string; paidAt: string | null; }>(`/api/payments/status/${courseId}`),
  /** If payment succeeded in Stripe but DB was never updated, call this (e.g. after revisiting enroll). */
  syncPaidEnrollment: (courseId: string) =>
    apiFetch<{ enrollmentId: string | null; synced?: boolean; }>(`/api/payments/sync/${courseId}`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  /** Finalize every PENDING payment row that is already succeeded in Stripe (fixes empty My Courses). */
  syncPendingPayments: () =>
    apiFetch<{ pendingCount: number; finalized: number; }>("/api/payments/sync-pending", {
      method: "POST",
      body: JSON.stringify({}),
    }),
};

// ─── Student Dashboard Extended APIs ──────────────────────
export const leaderboardApi = {
  get: (p?: { clusterId?: string; period?: string; }) => apiFetch<any>(`${S}/leaderboard${qs(p)}`),
  getOptIn: () => apiFetch<any>(`${S}/leaderboard/opt-in-status`),
  optIn: () => apiFetch<any>(`${S}/leaderboard/opt-in`, { method: "POST" }),
  optOut: () => apiFetch<any>(`${S}/leaderboard/opt-out`, { method: "POST" }),
};

export const studyPlannerApi = {
  getGoals: () => apiFetch<any[]>(`${S}/study-planner`),
  getStreak: () => apiFetch<any>(`${S}/study-planner/streak`),
  getSummary: () => apiFetch<any>(`${S}/study-planner/summary`),
  createGoal: (body: any) => apiFetch<any>(`${S}/study-planner`, { method: "POST", body: JSON.stringify(body) }),
  updateGoal: (id: string, body: any) => apiFetch<any>(`${S}/study-planner/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteGoal: (id: string) => apiFetch<any>(`${S}/study-planner/${id}`, { method: "DELETE" }),
  logFocus: (id: string, minutes: number) => apiFetch<any>(`${S}/study-planner/${id}/focus`, { method: "POST", body: JSON.stringify({ minutes }) }),
};

export const annotationApi = {
  getResources: () => apiFetch<any[]>(`${S}/annotations/resources`),
  getAnnotations: (resourceId: string) => apiFetch<any[]>(`${S}/annotations${qs({ resourceId })}`),
  getShared: (resourceId: string) => apiFetch<any[]>(`${S}/annotations/shared${qs({ resourceId })}`),
  create: (body: any) => apiFetch<any>(`${S}/annotations`, { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`${S}/annotations/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch<any>(`${S}/annotations/${id}`, { method: "DELETE" }),
};

export const resourceAiApi = {
  status: (resourceId: string) => apiFetch<any>(`/api/resource/${resourceId}/processing-status`),
  summary: (resourceId: string) => apiFetch<any>(`/api/resource/${resourceId}/summary`),
  citations: (resourceId: string) => apiFetch<any[]>(`/api/resource/${resourceId}/citations`),
  graph: (resourceId: string, p?: { includeExternal?: string; minConfidence?: string; limit?: string }) =>
    apiFetch<any>(`/api/resource/${resourceId}/graph${qs(p)}`),
  process: (resourceId: string, body?: { regenerateSummary?: boolean; reanalyzeCitations?: boolean }) =>
    apiFetch<any>(`/api/resource/${resourceId}/process-ai`, { method: "POST", body: JSON.stringify(body ?? {}) }),
  regenerateSummary: (resourceId: string) =>
    apiFetch<any>(`/api/resource/${resourceId}/summary/regenerate`, { method: "POST" }),
  reanalyzeCitations: (resourceId: string) =>
    apiFetch<any>(`/api/resource/${resourceId}/citations/reanalyze`, { method: "POST" }),
  regenerateGraph: (resourceId: string) =>
    apiFetch<any>(`/api/resource/${resourceId}/graph/regenerate`, { method: "POST" }),
  setSummaryVisibility: (resourceId: string, isVisible: boolean) =>
    apiFetch<any>(`/api/resource/${resourceId}/summary/visibility`, { method: "PATCH", body: JSON.stringify({ isVisible }) }),
  // Short preview (~1800 chars) of the extracted PDF text so the UI can show
  // the user what the AI is going to summarize before they trigger generation.
  extractedTextPreview: (resourceId: string) =>
    apiFetch<any>(`/api/resource/${resourceId}/extracted-text-preview`),
};

// ─── Admin Platform APIs ──────────────────────────────────
const AP = "/api/admin/platform";
export const adminPlatformApi = {
  getAnalytics: () => apiFetch<any>(`${AP}/analytics`),
  getAnnouncements: (p?: any) => apiFetch<any>(`${AP}/announcements${qs(p)}`),
  createAnnouncement: (body: any) => apiFetch<any>(`${AP}/announcements`, { method: "POST", body: JSON.stringify(body) }),
  deleteAnnouncement: (id: string) => apiFetch<any>(`${AP}/announcements/${id}`, { method: "DELETE" }),
  getClusters: (p?: any) => apiFetch<any>(`${AP}/clusters${qs(p)}`),
  getModeration: (p?: any) => apiFetch<any>(`${AP}/moderation${qs(p)}`),
  removeComment: (id: string) => apiFetch<any>(`${AP}/moderation/comments/${id}`, { method: "DELETE" }),
  removeCourse: (id: string) => apiFetch<any>(`${AP}/moderation/courses/${id}`, { method: "DELETE" }),
  removeResource: (id: string) => apiFetch<any>(`${AP}/moderation/resources/${id}`, { method: "DELETE" }),
  warnUser: (userId: string, reason: string) => apiFetch<any>(`${AP}/moderation/warn/${userId}`, { method: "POST", body: JSON.stringify({ reason }) }),
  getWarnings: (userId: string) => apiFetch<any>(`${AP}/moderation/warnings/${userId}`),
  removeWarning: (warningId: string) => apiFetch<any>(`${AP}/moderation/warnings/${warningId}`, { method: "DELETE" }),
  getCertificates: (p?: any) => apiFetch<any>(`${AP}/certificates${qs(p)}`),
  generateCert: (enrollmentId: string) => apiFetch<any>(`${AP}/certificates/${enrollmentId}`, { method: "POST" }),
  enroll: (userId: string, courseId: string) => apiFetch<any>(`${AP}/enroll`, { method: "POST", body: JSON.stringify({ userId, courseId }) }),
  unenroll: (userId: string, courseId: string) => apiFetch<any>(`${AP}/unenroll`, { method: "POST", body: JSON.stringify({ userId, courseId }) }),
  // Email Templates
  getEmailTemplates: () => apiFetch<any>(`${AP}/email-templates`),
  createEmailTemplate: (body: any) => apiFetch<any>(`${AP}/email-templates`, { method: "POST", body: JSON.stringify(body) }),
  updateEmailTemplate: (id: string, body: any) => apiFetch<any>(`${AP}/email-templates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteEmailTemplate: (id: string) => apiFetch<any>(`${AP}/email-templates/${id}`, { method: "DELETE" }),
  // Personal notices
  sendPersonalNotice: (targetUserId: string, payload: { title: string; body: string; urgency?: string; }) =>
    apiFetch<any>(`${AP}/announcements`, { method: "POST", body: JSON.stringify({ ...payload, targetUserId }) }),
};

// ─── Teacher Notice API ───────────────────────────────────
export const teacherNoticeApi = {
  getNotices: (p?: Record<string, string | number | undefined>) => apiFetch<any>(`/api/teacher/notices${qs(p)}`),
  markRead: (id: string) => apiFetch<any>(`/api/teacher/notices/${id}/read`, { method: "PATCH" }),
};

// ─── Admin Users API ──────────────────────────────────────
const AU = "/api/admin/users";
export const adminUsersApi = {
  getUsers: (p?: any) => apiFetch<any>(`${AU}${qs(p)}`),
  getUser: (id: string) => apiFetch<any>(`${AU}/${id}`),
  updateUser: (id: string, body: any) => apiFetch<any>(`${AU}/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deactivate: (id: string) => apiFetch<any>(`${AU}/${id}`, { method: "DELETE" }),
  resetPwd: (id: string) => apiFetch<any>(`${AU}/${id}/reset-password`, { method: "POST" }),
  impersonate: (id: string) => apiFetch<any>(`${AU}/${id}/impersonate`, { method: "POST" }),
};

// ─── Teacher Dashboard Extended APIs ─────────────────────
const TA = "/api/teacher";
export const teacherDashApi = {
  getAnalytics: () => apiFetch<any>(`${TA}/analytics`),
  getSessionHistory: (p?: any) => apiFetch<any>(`${TA}/session-history${qs(p)}`),
  getTemplates: () => apiFetch<any[]>(`${TA}/task-templates`),
  createTemplate: (body: any) => apiFetch<any>(`${TA}/task-templates`, { method: "POST", body: JSON.stringify(body) }),
  updateTemplate: (id: string, body: any) => apiFetch<any>(`${TA}/task-templates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTemplate: (id: string) => apiFetch<any>(`${TA}/task-templates/${id}`, { method: "DELETE" }),
  getClusters: () => apiFetch<any[]>(`/api/cluster`),
  getClusterMembers: (clusterId: string) => apiFetch<any[]>(`${TA}/tasks/clusters/${clusterId}/members`),
};
