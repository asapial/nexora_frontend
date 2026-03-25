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
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type Urgency = "INFO" | "WARNING" | "URGENT";

interface Cluster { id: string; name: string }
interface Notice {
  id: string;
  title: string;
  body: string;
  urgency: Urgency;
  isGlobal: boolean;
  publishedAt: string | null;
  createdAt: string;
  isRead: boolean;
  author: { name: string; email: string } | null;
  clusters: { cluster: Cluster }[];
}

const URGENCY: Record<Urgency, { icon: React.ReactNode; badge: string; dot: string }> = {
  INFO: {
    icon: <RiInformationLine />,
    badge: "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",
    dot: "bg-sky-500",
  },
  WARNING: {
    icon: <RiAlertLine />,
    badge: "bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50",
    dot: "bg-amber-500",
  },
  URGENT: {
    icon: <RiErrorWarningLine />,
    badge: "bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50",
    dot: "bg-red-500",
  },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ urgency: string; unread: string }>({
    urgency: "",
    unread: "",
  });

  const fetchNotices = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.urgency) params.set("urgency", filter.urgency);
    if (filter.unread) params.set("unread", filter.unread);
    fetch(`/api/student/notices?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNotices(d.data);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const markRead = async (id: string) => {
    setMarkingId(id);
    try {
      await fetch(`/api/student/notices/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      setNotices((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } finally {
      setMarkingId(null);
    }
  };

  const unreadCount = notices.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6">
      {/* Heading */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">
              Announcements
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground mr-1">
          <RiFilterLine /> Filter:
        </div>
        {(["", "INFO", "WARNING", "URGENT"] as const).map((u) => (
          <button
            key={u}
            onClick={() => setFilter((f) => ({ ...f, urgency: u }))}
            className={cn(
              "text-[11.5px] font-semibold px-3 py-1 rounded-full border transition-colors",
              filter.urgency === u
                ? "bg-teal-600 text-white border-teal-600"
                : "border-border text-muted-foreground hover:bg-muted/40"
            )}
          >
            {u === "" ? "All" : u}
          </button>
        ))}
        <div className="h-4 w-px bg-border mx-1" />
        {([["", "All"], ["true", "Unread"], ["false", "Read"]] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter((f) => ({ ...f, unread: val }))}
            className={cn(
              "text-[11.5px] font-semibold px-3 py-1 rounded-full border transition-colors",
              filter.unread === val
                ? "bg-violet-600 text-white border-violet-600"
                : "border-border text-muted-foreground hover:bg-muted/40"
            )}
          >
            {label}
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
          : notices.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <RiMegaphoneLine className="text-4xl text-muted-foreground/30 mb-3" />
              <p className="text-[14px] font-semibold text-foreground mb-1">No notices</p>
              <p className="text-[12.5px] text-muted-foreground">
                No announcements match your current filter.
              </p>
            </div>
          )
          : notices.map((n) => {
            const u = URGENCY[n.urgency] ?? URGENCY.INFO;
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
                  <div
                    className={cn(
                      "mt-0.5 w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm border",
                      u.badge
                    )}
                  >
                    {u.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p
                        className={cn(
                          "text-[13.5px] font-bold leading-snug",
                          n.isRead ? "text-foreground/60" : "text-foreground"
                        )}
                      >
                        {n.title}
                        {!n.isRead && (
                          <span
                            className={cn(
                              "inline-block ml-2 w-1.5 h-1.5 rounded-full align-middle",
                              u.dot
                            )}
                          />
                        )}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {n.isGlobal && (
                          <span className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-violet-100/80 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50">
                            Platform
                          </span>
                        )}
                        <span
                          className={cn(
                            "text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border",
                            u.badge
                          )}
                        >
                          {n.urgency}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <p className="text-[12.5px] text-muted-foreground leading-relaxed mb-3">
                      {n.body}
                    </p>

                    {/* Clusters */}
                    {n.clusters.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {n.clusters.map(({ cluster }) => (
                          <span
                            key={cluster.id}
                            className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground"
                          >
                            {cluster.name}
                          </span>
                        ))}
                      </div>
                    )}

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
