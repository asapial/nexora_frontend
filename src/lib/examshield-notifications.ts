export type ExamShieldNotification = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
};

export const examShieldNotificationToastId = (notification: Pick<ExamShieldNotification, "id" | "link">) => {
  if (notification.link) {
    try {
      const eventId = new URL(notification.link, "https://nexora.local").searchParams.get("eventId");
      if (eventId) return `examshield-${eventId}`;
    } catch {
      // A malformed optional link should not prevent the notification from rendering.
    }
  }
  return `examshield-notification-${notification.id}`;
};

export const unseenExamShieldNotifications = (
  notifications: ExamShieldNotification[],
  seenIds: ReadonlySet<string>,
) => notifications
  .filter((notification) => !seenIds.has(notification.id))
  .sort((first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime());
