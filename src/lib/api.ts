// ─── API Client ───────────────────────────────────────────
const BASE = "/api";

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data: T; message: string }> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? "Request failed");
  }
  return json;
}

export const courseApi = {
  // Courses
  list: () => apiFetch<any[]>(`${BASE}/courses`),
  get: (id: string) => apiFetch<any>(`${BASE}/courses/${id}`),
  create: (body: any) => apiFetch<any>(`${BASE}/courses`, { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`${BASE}/courses/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  submit: (id: string) => apiFetch<any>(`${BASE}/courses/${id}/submit`, { method: "POST" }),
  close: (id: string) => apiFetch<any>(`${BASE}/courses/${id}/close`, { method: "POST" }),

  // Missions
  getMissions: (courseId: string) => apiFetch<any[]>(`${BASE}/courses/${courseId}/missions`),
  createMission: (courseId: string, body: any) => apiFetch<any>(`${BASE}/courses/${courseId}/missions`, { method: "POST", body: JSON.stringify(body) }),
  updateMission: (courseId: string, missionId: string, body: any) => apiFetch<any>(`${BASE}/courses/${courseId}/missions/${missionId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteMission: (courseId: string, missionId: string) => apiFetch<any>(`${BASE}/courses/${courseId}/missions/${missionId}`, { method: "DELETE" }),
  submitMission: (courseId: string, missionId: string) => apiFetch<any>(`${BASE}/courses/${courseId}/missions/${missionId}/submit`, { method: "POST" }),

  // Contents
  getContents: (missionId: string) => apiFetch<any[]>(`${BASE}/missions/${missionId}/contents`),
  createContent: (missionId: string, body: any) => apiFetch<any>(`${BASE}/missions/${missionId}/contents`, { method: "POST", body: JSON.stringify(body) }),
  updateContent: (missionId: string, contentId: string, body: any) => apiFetch<any>(`${BASE}/missions/${missionId}/contents/${contentId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteContent: (missionId: string, contentId: string) => apiFetch<any>(`${BASE}/missions/${missionId}/contents/${contentId}`, { method: "DELETE" }),
  reorderContents: (missionId: string, orderedIds: string[]) => apiFetch<any>(`${BASE}/missions/${missionId}/contents/reorder`, { method: "PATCH", body: JSON.stringify({ orderedIds }) }),

  // Price Requests
  getPriceRequests: (courseId: string) => apiFetch<any[]>(`${BASE}/courses/${courseId}/price-requests`),
  createPriceRequest: (courseId: string, body: any) => apiFetch<any>(`${BASE}/courses/${courseId}/price-request`, { method: "POST", body: JSON.stringify(body) }),

  // Enrollments
  getEnrollments: (courseId: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`${BASE}/courses/${courseId}/enrollments${qs}`);
  },
  getEnrollmentStats: (courseId: string) => apiFetch<any>(`${BASE}/courses/${courseId}/enrollments/stats`),

  // Earnings
  getEarnings: () => apiFetch<any>(`${BASE}/teacher/earnings`),
  getTransactions: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any>(`${BASE}/teacher/earnings/transactions${qs}`);
  },
};