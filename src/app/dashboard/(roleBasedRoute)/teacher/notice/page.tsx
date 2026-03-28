"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RiSparklingFill,
  RiMegaphoneLine,
  RiInformationLine,
  RiAlertLine,
  RiErrorWarningLine,
  RiCheckboxCircleLine,
  RiFilterLine,
  RiRefreshLine,
  RiUserLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { teacherNoticeApi } from "@/lib/api";
import { toast } from "sonner";

type Urgency = "INFO" | "IMPORTANT" | "CRITICAL";
type TabKey = "all" | "teachers" | "personal";

interface Notice {
  id: string;
  title: string;
  body: string;
  urgency: Urgency;
  isGlobal: boolean;
  targetRole?: string | null;
  targetUserId?: string | null;
  publishedAt: string | null;
  createdAt: string;
  isRead: boolean;
  author: { name: string; email: string } | null;
}

const URGENCY: Record<Urgency, { icon: React.ReactNode; badge: string; dot: string }> = {
  INFO: {
    icon: <RiInformationLine />,
    badge: "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",
    dot: "bg-sky-500",
  },
  IMPORTANT: {
    icon: <RiAlertLine />,
    badge: "bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50",
    dot: "bg-amber-500",
  },
  CRITICAL: {
    icon: <RiErrorWarningLine />,
    badge: "bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50",
    dot: "bg-red-500",
  },
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "all",      label: "All Notices" },
  { key: "teachers", label: "Teachers Only" },
  { key: "personal", label: "Personal" },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TeacherNoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [urgencyFilter, setUrgencyFilter] = useState("");

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const r = await teacherNoticeApi.getNotices();
      const raw = r.data;
      setNotices(Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const markRead = async (id: string) => {
    setMarkingId(id);
    try {
      await teacherNoticeApi.markRead(id);
      setNotices(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      // ignore
    } finally {
      setMarkingId(null);
    }
  };

  // Client-side filter by tab
  const filtered = notices.filter(n => {
    if (urgencyFilter && n.urgency !== urgencyFilter) return false;
    if (activeTab === "personal") return !!n.targetUserId;
    if (activeTab === "teachers") return n.targetRole === "TEACHER";
    return true; // "all"
  });

  const unreadCount = filtered.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6 max-w-3xl mx-auto w-full">
      {/* Heading */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">
              Teacher
            </span>
          </div>
          <h1 className="text-[1.55rem] font-extrabold tracking-tight leading-none text-foreground">
            Notice Board
          </h1>
          {unreadCount > 0 && (
            <p className="text-[12.5px] text-muted-foreground mt-1">
              <span className="font-bold text-teal-600 dark:text-teal-400">{unreadCount}</span> unread
            </p>
          )}
        </div>
        <button
          onClick={fetchNotices}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted/40"
        >
          <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn("h-8 px-4 rounded-lg text-[12.5px] font-semibold transition-all",
              activeTab === t.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Urgency filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground mr-1">
          <RiFilterLine /> Urgency:
        </div>
        {(["", "INFO", "IMPORTANT", "CRITICAL"] as const).map(u => (
          <button
            key={u}
            onClick={() => setUrgencyFilter(u)}
            className={cn(
              "text-[11.5px] font-semibold px-3 py-1 rounded-full border transition-colors",
              urgencyFilter === u
                ? "bg-teal-600 text-white border-teal-600"
                : "border-border text-muted-foreground hover:bg-muted/40"
            )}
          >
            {u === "" ? "All" : u}
          </button>
        ))}
      </div>

      {/* Notices list */}
      <div className="flex flex-col gap-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </div>
              </div>
            ))
          : filtered.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <RiMegaphoneLine className="text-4xl text-muted-foreground/30 mb-3" />
              <p className="text-[14px] font-semibold text-foreground mb-1">No notices</p>
              <p className="text-[12.5px] text-muted-foreground">
                {activeTab === "personal"
                  ? "No personal notices from admin yet."
                  : activeTab === "teachers"
                  ? "No teacher-specific announcements."
                  : "No notices match your current filter."}
              </p>
            </div>
          )
          : filtered.map(n => {
            const u = URGENCY[n.urgency] ?? URGENCY.INFO;
            const isPersonal = !!n.targetUserId;
            return (
              <div
                key={n.id}
                className={cn(
                  "rounded-2xl border bg-card p-5 transition-all duration-200",
                  n.isRead
                    ? "border-border opacity-70"
                    : "border-border/80 shadow-sm shadow-black/[0.03] dark:shadow-black/10"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Urgency icon */}
                  <div className={cn("mt-0.5 w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm border", u.badge)}>
                    {u.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className={cn("text-[13.5px] font-bold leading-snug", n.isRead ? "text-foreground/60" : "text-foreground")}>
                        {n.title}
                        {!n.isRead && (
                          <span className={cn("inline-block ml-2 w-1.5 h-1.5 rounded-full align-middle", u.dot)} />
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isPersonal && (
                          <span className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-violet-100/80 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50 flex items-center gap-0.5">
                            <RiUserLine className="text-[9px]" /> Personal
                          </span>
                        )}
                        {n.targetRole === "TEACHER" && !isPersonal && (
                          <span className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70">
                            Teachers only
                          </span>
                        )}
                        {n.isGlobal && !isPersonal && (
                          <span className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-violet-100/80 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50">
                            Platform
                          </span>
                        )}
                        <span className={cn("text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", u.badge)}>
                          {n.urgency}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <p className="text-[12.5px] text-muted-foreground leading-relaxed mb-3">{n.body}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground/55">
                        {n.author?.name ?? "System"} · {timeAgo(n.createdAt)}
                      </span>
                      {!n.isRead && (
                        <button
                          onClick={() => markRead(n.id)}
                          disabled={markingId === n.id}
                          className="flex items-center gap-1.5 text-[11.5px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors disabled:opacity-40"
                        >
                          <RiCheckboxCircleLine className="text-sm" />
                          {markingId === n.id ? "Marking…" : "Mark as read"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
