"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { RiArrowRightUpLine, RiNotification3Line, RiShieldCheckLine } from "react-icons/ri";
import { toast } from "sonner";
import { notificationApi } from "@/lib/api";
import {
  ExamShieldNotification,
  examShieldNotificationToastId,
  unseenExamShieldNotifications,
} from "@/lib/examshield-notifications";
import { useSession } from "@/provider/session-provider";

export function ExamShieldAlerts() {
  const { user } = useSession();
  if (user?.role !== "TEACHER") return null;
  return <TeacherExamShieldAlerts key={user.id} />;
}

function TeacherExamShieldAlerts() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ExamShieldNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenIdsRef = useRef<Set<string> | null>(null);

  const markRead = useCallback(async (notification: ExamShieldNotification) => {
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    setUnreadCount((current) => Math.max(0, current - 1));
    try {
      await notificationApi.markRead(notification.id);
    } catch {
      // The next poll restores the row if marking it read did not persist.
    }
  }, []);

  const openNotification = useCallback((notification: ExamShieldNotification) => {
    void markRead(notification);
    router.push(notification.link || "/dashboard/teacher/exams/proctoring");
  }, [markRead, router]);

  const refresh = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    try {
      const response = await notificationApi.list({ type: "EXAM_VIOLATION", unread: "true", limit: 20 });
      const rows = response.data.notifications as ExamShieldNotification[];
      const seenIds = seenIdsRef.current;
      if (seenIds) {
        for (const notification of unseenExamShieldNotifications(rows, seenIds)) {
          toast.warning(notification.title, {
            id: examShieldNotificationToastId(notification),
            description: notification.body ?? "Review this detector warning before making an exam-integrity decision.",
            duration: 12_000,
            action: {
              label: "Review",
              onClick: () => openNotification(notification),
            },
          });
        }
      }
      seenIdsRef.current = new Set([...(seenIds ?? []), ...rows.map((notification) => notification.id)]);
      setNotifications(rows);
      setUnreadCount(response.data.unreadCount);
    } catch {
      // Delivery is DB-backed; a later poll safely catches up without interrupting the dashboard.
    }
  }, [openNotification]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 3_000);
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return (
    <details className="group relative">
      <summary className="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-rose-500/30 hover:text-rose-600 [&::-webkit-details-marker]:hidden" aria-label={`${unreadCount} unread Exam Shield alerts`}>
        <RiNotification3Line className="text-base" />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[8px] font-black text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </summary>
      <div className="absolute right-0 top-11 z-50 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-rose-500/5 px-4 py-3">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black text-rose-700 dark:text-rose-300"><RiShieldCheckLine /> Exam Shield alerts</p>
            <p className="mt-0.5 text-[9px] text-muted-foreground">Detector warnings require teacher review.</p>
          </div>
          <span className="rounded-full bg-rose-500/10 px-2 py-1 text-[8px] font-extrabold text-rose-600">{unreadCount} unread</span>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-[10px] text-muted-foreground">No unread Exam Shield alerts.</p>
          ) : notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.link || "/dashboard/teacher/exams/proctoring"}
              onClick={() => void markRead(notification)}
              className="block rounded-xl border border-transparent px-3 py-3 transition hover:border-rose-500/20 hover:bg-rose-500/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-extrabold text-foreground">{notification.title}</p>
                  {notification.body && <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-muted-foreground">{notification.body}</p>}
                  <p className="mt-1.5 text-[8px] font-bold text-rose-600">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
                <RiArrowRightUpLine className="mt-0.5 shrink-0 text-rose-500" />
              </div>
            </Link>
          ))}
        </div>
        <Link href="/dashboard/teacher/exams/proctoring" className="flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-[9px] font-extrabold text-teal-600 hover:bg-muted/40">
          Open proctoring console <RiArrowRightUpLine />
        </Link>
      </div>
    </details>
  );
}
