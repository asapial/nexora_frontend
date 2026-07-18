import { describe, expect, it } from "vitest";
import { examShieldNotificationToastId, unseenExamShieldNotifications } from "./examshield-notifications";

const notification = (id: string, createdAt: string, link?: string) => ({
  id,
  type: "EXAM_VIOLATION",
  title: "Device visible",
  body: null,
  isRead: false,
  link,
  createdAt,
});

describe("Exam Shield notification helpers", () => {
  it("uses the event id to deduplicate global and live-console toasts", () => {
    expect(examShieldNotificationToastId(notification(
      "notification-1",
      "2026-07-18T10:00:00.000Z",
      "/dashboard/teacher/exams/proctoring?examId=exam-1&eventId=event-9",
    ))).toBe("examshield-event-9");
  });

  it("falls back to the notification id for absent or malformed links", () => {
    expect(examShieldNotificationToastId(notification("notification-2", "2026-07-18T10:00:00.000Z")))
      .toBe("examshield-notification-notification-2");
  });

  it("returns only unseen notifications in chronological order", () => {
    const rows = [
      notification("later", "2026-07-18T10:00:02.000Z"),
      notification("seen", "2026-07-18T10:00:01.000Z"),
      notification("earlier", "2026-07-18T10:00:00.000Z"),
    ];
    expect(unseenExamShieldNotifications(rows, new Set(["seen"])).map((row) => row.id))
      .toEqual(["earlier", "later"]);
  });
});
