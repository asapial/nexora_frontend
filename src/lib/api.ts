// ─── Core fetch wrapper ───────────────────────────────────
async function apiFetch<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data: T; message: string }> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? "Request failed");
  return json;
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
  create: (body: any) => apiFetch<any>(`${T}/courses`, { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`${T}/courses/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  submit: (id: string) => apiFetch<any>(`${T}/courses/${id}/submit`, { method: "POST" }),
  close: (id: string) => apiFetch<any>(`${T}/courses/${id}/close`, { method: "POST" }),
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
  getPendingCourses:      (p?: any) => apiFetch<any>(`${A}/courses${qs({ status: "PENDING_APPROVAL", ...p })}`),
  getAllCourses:           (p?: any) => apiFetch<any>(`${A}/courses${qs(p)}`),
  getCourse:              (id: string) => apiFetch<any>(`${A}/courses/${id}`),
  approveCourse:          (id: string) => apiFetch<any>(`${A}/courses/${id}/approve`, { method: "POST" }),
  rejectCourse:           (id: string, note: string) => apiFetch<any>(`${A}/courses/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
  deleteCourse:           (id: string) => apiFetch<any>(`${A}/courses/${id}`, { method: "DELETE" }),
  toggleFeatured:         (id: string) => apiFetch<any>(`${A}/courses/${id}/feature`, { method: "POST" }),
  setRevenuePercent:      (id: string, percent: number) => apiFetch<any>(`${A}/courses/${id}/revenue-percent`, { method: "PATCH", body: JSON.stringify({ percent }) }),
  getPendingMissions:     (p?: any) => apiFetch<any>(`${A}/missions${qs({ status: "PENDING_APPROVAL", ...p })}`),
  approveMission:         (id: string) => apiFetch<any>(`${A}/missions/${id}/approve`, { method: "POST" }),
  rejectMission:          (id: string, note: string) => apiFetch<any>(`${A}/missions/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
  getPendingPriceReqs:    (p?: any) => apiFetch<any>(`${A}/price-requests${qs(p)}`),
  approvePriceRequest:    (id: string, price: number) => apiFetch<any>(`${A}/price-requests/${id}/approve`, { method: "POST", body: JSON.stringify({ price }) }),
  rejectPriceRequest:     (id: string, note: string) => apiFetch<any>(`${A}/price-requests/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
  getAllEnrollments:       (p?: any) => apiFetch<any>(`${A}/enrollments${qs(p)}`),
  getRevenue:             () => apiFetch<any>(`${A}/revenue`),
  getRevenueTransactions: (p?: any) => apiFetch<any>(`${A}/revenue/transactions${qs(p)}`),
};

// ─── Student / Public API ─────────────────────────────────
const S = "/api/student";
export const studentApi = {
  getCatalog:        (p?: any) => apiFetch<any>(`/api/courses/public${qs(p)}`),
  getCoursePublic:   (id: string) => apiFetch<any>(`/api/courses/${id}/public`),
  freeEnroll:        (courseId: string) => apiFetch<any>(`/api/payments/enroll/${courseId}`, { method: "POST", body: JSON.stringify({}) }),
  getMyEnrollments:  (p?: any) => apiFetch<any>(`${S}/enrollments${qs(p)}`),
  getMyEnrollment:   (courseId: string) => apiFetch<any>(`${S}/enrollments/${courseId}`),
  completeMission:   (courseId: string, missionId: string) => apiFetch<any>(`${S}/enrollments/${courseId}/missions/${missionId}/complete`, { method: "POST" }),
  getMissionContents:(missionId: string) => apiFetch<any[]>(`${S}/missions/${missionId}/contents`),
};

export const settingsApi = {
  getAccount: () => apiFetch<any>("/api/settings/account"),
  updateAccount: (body: Record<string, unknown>) =>
    apiFetch<any>("/api/settings/account", { method: "PATCH", body: JSON.stringify(body) }),
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
    apiFetch<{ enrollmentId: string | null; alreadyFinalized?: boolean }>("/api/payments/confirm", {
      method: "POST",
      body: JSON.stringify({ paymentIntentId }),
    }),
  getStatus: (courseId: string) =>
    apiFetch<{ status: string; paidAt: string | null }>(`/api/payments/status/${courseId}`),
  /** If payment succeeded in Stripe but DB was never updated, call this (e.g. after revisiting enroll). */
  syncPaidEnrollment: (courseId: string) =>
    apiFetch<{ enrollmentId: string | null; synced?: boolean }>(`/api/payments/sync/${courseId}`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  /** Finalize every PENDING payment row that is already succeeded in Stripe (fixes empty My Courses). */
  syncPendingPayments: () =>
    apiFetch<{ pendingCount: number; finalized: number }>("/api/payments/sync-pending", {
      method: "POST",
      body: JSON.stringify({}),
    }),
};