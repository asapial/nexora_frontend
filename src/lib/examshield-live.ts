import type { ExamAttempt, ExamDetail, ProctorEvent } from "@/lib/examShield";

export type LiveProctorAction = "CREATED" | "REVIEWED" | "FEED_CLEARED" | "EVIDENCE_UPDATED";

export type LiveProctorEvent = ProctorEvent & {
  action: LiveProctorAction;
  attemptId: string;
  student: string;
  studentEmail: string;
  suspicious?: boolean;
  suspiciousCount?: number;
  feedClearedAt?: string;
  deletedEventIds?: string[];
  evidenceDeletionFailures?: number;
};

export type ProctorEventPage = {
  events: LiveProctorEvent[];
  cursor: string | null;
  hasMore: boolean;
};

const eventTime = (event: ProctorEvent) => {
  const value = new Date(event.occurredAt).getTime();
  return Number.isFinite(value) ? value : 0;
};

const compareEvents = (first: ProctorEvent, second: ProctorEvent) =>
  eventTime(second) - eventTime(first) || second.id.localeCompare(first.id);

const laterDate = (first?: string | null, second?: string | null) => {
  if (!first) return second ?? null;
  if (!second) return first;
  return new Date(second).getTime() > new Date(first).getTime() ? second : first;
};

const mergeEvent = (current: ProctorEvent, incoming: ProctorEvent): ProctorEvent => {
  const preserveCurrentReview = incoming.reviewDecision === "PENDING"
    && current.reviewDecision
    && current.reviewDecision !== "PENDING";

  return {
    ...current,
    ...incoming,
    evidenceUrl: incoming.evidenceUrl ?? current.evidenceUrl,
    reviewDecision: preserveCurrentReview ? current.reviewDecision : incoming.reviewDecision,
    reviewNote: preserveCurrentReview ? current.reviewNote : incoming.reviewNote,
  };
};

export const mergeProctorEvents = (
  current: ProctorEvent[],
  incoming: ProctorEvent[],
): ProctorEvent[] => {
  const byId = new Map(current.map((event) => [event.id, event]));
  for (const event of incoming) {
    const existing = byId.get(event.id);
    byId.set(event.id, existing ? mergeEvent(existing, event) : event);
  }
  return [...byId.values()].sort(compareEvents);
};

const mergeAttempt = (current: ExamAttempt, incoming: ExamAttempt): ExamAttempt => ({
  ...current,
  ...incoming,
  proctorFeedClearedAt: laterDate(current.proctorFeedClearedAt, incoming.proctorFeedClearedAt),
  proctorEvents: mergeProctorEvents(current.proctorEvents, incoming.proctorEvents),
});

/**
 * Reconciles a full server snapshot without allowing a slower request to erase
 * events that already arrived over the live or incremental transports.
 */
export const reconcileProctorDetail = (
  current: ExamDetail | null,
  incoming: ExamDetail,
): ExamDetail => {
  if (!current || current.id !== incoming.id) return incoming;

  const currentAttempts = new Map(current.attempts.map((attempt) => [attempt.id, attempt]));
  const mergedAttempts = incoming.attempts.map((attempt) => {
    const existing = currentAttempts.get(attempt.id);
    currentAttempts.delete(attempt.id);
    return existing ? mergeAttempt(existing, attempt) : attempt;
  });

  return {
    ...current,
    ...incoming,
    attempts: [...mergedAttempts, ...currentAttempts.values()],
  };
};

const deletedIdsFrom = (event: LiveProctorEvent) => {
  if (event.deletedEventIds) return event.deletedEventIds;
  const value = event.metadata?.deletedEventIds;
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
};

export type ApplyLiveProctorEventResult = {
  detail: ExamDetail | null;
  matchedAttempt: boolean;
  changed: boolean;
};

/** Applies one socket/incremental event to a hydrated exam detail. */
export const applyLiveProctorEvent = (
  detail: ExamDetail | null,
  event: LiveProctorEvent,
): ApplyLiveProctorEventResult => {
  if (!detail) return { detail, matchedAttempt: false, changed: false };
  const attemptIndex = detail.attempts.findIndex((attempt) => attempt.id === event.attemptId);
  if (attemptIndex < 0) return { detail, matchedAttempt: false, changed: false };

  const attempts = [...detail.attempts];
  const attempt = attempts[attemptIndex];
  let nextAttempt = attempt;

  if (event.action === "FEED_CLEARED") {
    const deletedIds = new Set(deletedIdsFrom(event));
    nextAttempt = {
      ...attempt,
      proctorFeedClearedAt: laterDate(attempt.proctorFeedClearedAt, event.feedClearedAt),
      proctorEvents: attempt.proctorEvents.filter((item) => !deletedIds.has(item.id)),
    };
  } else if (event.action === "REVIEWED") {
    nextAttempt = {
      ...attempt,
      suspicious: event.suspicious ?? attempt.suspicious,
      suspiciousCount: event.suspiciousCount ?? attempt.suspiciousCount,
      proctorEvents: attempt.proctorEvents.map((item) =>
        item.id === event.id ? mergeEvent(item, event) : item,
      ),
    };
  } else if (event.action === "EVIDENCE_UPDATED") {
    nextAttempt = {
      ...attempt,
      proctorEvents: attempt.proctorEvents.map((item) =>
        item.id === event.id ? mergeEvent(item, event) : item,
      ),
    };
  } else {
    const existing = attempt.proctorEvents.find((item) => item.id === event.id);
    nextAttempt = {
      ...attempt,
      proctorEvents: existing
        ? attempt.proctorEvents.map((item) => item.id === event.id ? mergeEvent(item, event) : item)
        : [event, ...attempt.proctorEvents].sort(compareEvents),
    };
  }

  if (nextAttempt === attempt) return { detail, matchedAttempt: true, changed: false };
  attempts[attemptIndex] = nextAttempt;
  return { detail: { ...detail, attempts }, matchedAttempt: true, changed: true };
};

/**
 * Bounded event-id registry shared by polling and WebSocket ingestion. Existing
 * detail is seeded explicitly so opening a console never replays old alerts.
 */
export class ProctorAlertRegistry {
  private readonly createdIds = new Set<string>();
  private readonly insertionOrder: string[] = [];

  constructor(private readonly capacity = 2_000) {}

  reset() {
    this.createdIds.clear();
    this.insertionOrder.length = 0;
  }

  seedDetail(detail: ExamDetail | null) {
    for (const attempt of detail?.attempts ?? []) this.seed(attempt.proctorEvents);
  }

  seed(events: Array<Pick<ProctorEvent, "id">>) {
    for (const event of events) this.remember(event.id);
  }

  ingest(events: LiveProctorEvent[]) {
    const created: LiveProctorEvent[] = [];
    for (const event of events) {
      // An evidence/review update can race ahead of the CREATED poll message.
      // Only a CREATED message consumes the one alert allowed for an event id.
      if (event.action !== "CREATED" || this.createdIds.has(event.id)) continue;
      this.remember(event.id);
      created.push(event);
    }
    return created;
  }

  private remember(id: string) {
    if (this.createdIds.has(id)) return;
    this.createdIds.add(id);
    this.insertionOrder.push(id);
    while (this.insertionOrder.length > this.capacity) {
      const oldest = this.insertionOrder.shift();
      if (oldest) this.createdIds.delete(oldest);
    }
  }
}
