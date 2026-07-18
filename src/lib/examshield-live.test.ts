import { describe, expect, it } from "vitest";
import type { ExamAttempt, ExamDetail, ProctorEvent } from "@/lib/examShield";
import {
  applyLiveProctorEvent,
  mergeProctorEvents,
  ProctorAlertRegistry,
  reconcileProctorDetail,
  type LiveProctorEvent,
} from "@/lib/examshield-live";

const event = (id: string, overrides: Partial<ProctorEvent> = {}): ProctorEvent => ({
  id,
  type: "PHONE_DETECTED",
  occurredAt: "2026-07-18T10:00:00.000Z",
  reviewDecision: "PENDING",
  evidenceUrl: null,
  ...overrides,
});

const liveEvent = (id: string, overrides: Partial<LiveProctorEvent> = {}): LiveProctorEvent => ({
  ...event(id),
  action: "CREATED",
  attemptId: "attempt-1",
  student: "Student One",
  studentEmail: "student@example.com",
  ...overrides,
});

const attempt = (id = "attempt-1", events: ProctorEvent[] = []): ExamAttempt => ({
  id,
  status: "IN_PROGRESS",
  suspicious: false,
  suspiciousCount: 0,
  startedAt: "2026-07-18T09:00:00.000Z",
  user: { id: `user-${id}`, name: "Student One", email: "student@example.com" },
  proctorEvents: events,
});

const detail = (attempts: ExamAttempt[] = [attempt()]): ExamDetail => ({
  id: "exam-1",
  title: "Exam",
  type: "MCQ",
  examMode: "PRO",
  status: "APPROVED",
  startTime: "2026-07-18T09:00:00.000Z",
  endTime: "2026-07-18T11:00:00.000Z",
  attempts,
  questions: [],
});

describe("ProctorAlertRegistry", () => {
  it("seeds historical detail without replaying alerts", () => {
    const historical = liveEvent("historical");
    const registry = new ProctorAlertRegistry();
    registry.seedDetail(detail([attempt("attempt-1", [historical])]));

    expect(registry.ingest([historical])).toEqual([]);
  });

  it("alerts once when the same device event arrives through both transports", () => {
    const registry = new ProctorAlertRegistry();
    const phone = liveEvent("phone");
    const laptop = liveEvent("laptop", {
      type: "DEVICE_DETECTED",
      metadata: { label: "Laptop" },
    });

    expect(registry.ingest([phone, laptop])).toEqual([phone, laptop]);
    expect(registry.ingest([laptop, phone])).toEqual([]);
  });

  it("does not turn update messages into new warning alerts", () => {
    const registry = new ProctorAlertRegistry();
    const update = liveEvent("updated", { action: "EVIDENCE_UPDATED" });

    expect(registry.ingest([update])).toEqual([]);
    expect(registry.ingest([{ ...update, action: "CREATED" }])).toEqual([{ ...update, action: "CREATED" }]);
    expect(registry.ingest([{ ...update, action: "CREATED" }])).toEqual([]);
  });

  it("alerts for an event created between full hydration and the bootstrap poll", () => {
    const registry = new ProctorAlertRegistry();
    const historical = liveEvent("historical");
    const raced = liveEvent("race-window");
    registry.seedDetail(detail([attempt("attempt-1", [historical])]));

    expect(registry.ingest([historical, raced])).toEqual([raced]);
  });
});

describe("proctor detail reconciliation", () => {
  it("preserves a live event that is absent from a stale full response", () => {
    const fromSocket = event("socket-new", { occurredAt: "2026-07-18T10:01:00.000Z" });
    const current = detail([attempt("attempt-1", [fromSocket])]);
    const stale = detail([attempt("attempt-1", [])]);

    expect(reconcileProctorDetail(current, stale).attempts[0].proctorEvents).toEqual([fromSocket]);
  });

  it("keeps newer evidence and a reviewed decision against a stale pending row", () => {
    const currentEvent = event("same", {
      evidenceUrl: "https://example.com/evidence.jpg",
      reviewDecision: "CONFIRMED_CONCERN",
      reviewNote: "Reviewed",
    });
    const staleEvent = event("same", { evidenceUrl: null, reviewDecision: "PENDING", reviewNote: null });
    const result = reconcileProctorDetail(
      detail([attempt("attempt-1", [currentEvent])]),
      detail([attempt("attempt-1", [staleEvent])]),
    ).attempts[0].proctorEvents[0];

    expect(result.evidenceUrl).toBe("https://example.com/evidence.jpg");
    expect(result.reviewDecision).toBe("CONFIRMED_CONCERN");
    expect(result.reviewNote).toBe("Reviewed");
  });

  it("unions newly discovered attempts and orders equal-time events deterministically", () => {
    const merged = reconcileProctorDetail(
      detail([attempt("attempt-local", [event("a")])]),
      detail([attempt("attempt-server", [event("b"), event("a")])]),
    );

    expect(merged.attempts.map((item) => item.id)).toEqual(["attempt-server", "attempt-local"]);
    expect(mergeProctorEvents([], [event("a"), event("b")]).map((item) => item.id)).toEqual(["b", "a"]);
  });
});

describe("applyLiveProctorEvent", () => {
  it("reports an unknown attempt so the caller can reconcile immediately", () => {
    const result = applyLiveProctorEvent(detail(), liveEvent("new", { attemptId: "new-attempt" }));

    expect(result.matchedAttempt).toBe(false);
    expect(result.changed).toBe(false);
  });

  it("adds a created event only once", () => {
    const created = liveEvent("device", { type: "DEVICE_DETECTED" });
    const first = applyLiveProctorEvent(detail(), created);
    const second = applyLiveProctorEvent(first.detail, created);

    expect(first.detail?.attempts[0].proctorEvents).toHaveLength(1);
    expect(second.detail?.attempts[0].proctorEvents).toHaveLength(1);
  });

  it("handles feed-cleared ids carried in metadata", () => {
    const current = detail([attempt("attempt-1", [event("remove"), event("keep")])]);
    const cleared = liveEvent("clear", {
      action: "FEED_CLEARED",
      feedClearedAt: "2026-07-18T10:05:00.000Z",
      metadata: { deletedEventIds: ["remove"] },
    });
    const result = applyLiveProctorEvent(current, cleared);

    expect(result.detail?.attempts[0].proctorEvents.map((item) => item.id)).toEqual(["keep"]);
    expect(result.detail?.attempts[0].proctorFeedClearedAt).toBe("2026-07-18T10:05:00.000Z");
  });
});
