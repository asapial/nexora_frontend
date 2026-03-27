"use client";

import { useEffect, useState } from "react";
import {
  RiSparklingFill,
  RiBarChartBoxLine,
  RiCheckboxCircleLine,
  RiCalendarCheckLine,
  RiTrophyLine,
  RiBookLine,
  RiTimeLine,
  RiFlaskLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Badge {
  id: string;
  awardedAt: string;
  milestone: { name: string; badgeIcon: string | null; criteria: unknown };
}
interface PendingHomework {
  id: string;
  title: string;
  homework: string;
  deadline: string | null;
  StudySession: { id: string; title: string; scheduledAt: string };
}
interface SessionItem {
  sessionId: string;
  sessionTitle: string;
  scheduledAt: string;
  sessionStatus: string;
  cluster: { id: string; name: string };
  attendanceStatus: string;
}
interface ProgressData {
  submissionRate: number;
  averageScore: number;
  attendanceRate: number;
  totalTasks: number;
  submittedTasks: number;
  totalAttendance: number;
  presentAttendance: number;
  pendingHomework: PendingHomework[];
  badges: Badge[];
  sessionTimeline: SessionItem[];
}

// ─── Stat card ────────────────────────────────────────────────────────────────
type Accent = "teal" | "violet" | "amber" | "sky";
const ACCENT: Record<Accent, { icon: string; bg: string; border: string; ring: string }> = {
  teal:   { icon: "text-teal-600 dark:text-teal-400",     bg: "bg-teal-100/70 dark:bg-teal-950/50",    border: "border-teal-200/70 dark:border-teal-800/50",   ring: "bg-teal-500" },
  violet: { icon: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100/70 dark:bg-violet-950/50", border: "border-violet-200/70 dark:border-violet-800/50", ring: "bg-violet-500" },
  amber:  { icon: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-100/70 dark:bg-amber-950/50",  border: "border-amber-200/70 dark:border-amber-800/50",   ring: "bg-amber-500" },
  sky:    { icon: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-100/70 dark:bg-sky-950/50",      border: "border-sky-200/70 dark:border-sky-800/50",       ring: "bg-sky-500" },
};

function StatCard({
  label, value, sub, icon, accent,
}: {
  label: string; value: string; sub: string; icon: React.ReactNode; accent: Accent;
}) {
  const a = ACCENT[accent];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-md hover:shadow-black/[0.04] dark:hover:shadow-black/20 transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-[18px] border", a.bg, a.border, a.icon)}>
          {icon}
        </div>
        <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground border-border">
          {sub}
        </span>
      </div>
      <p className="text-[2rem] font-extrabold tabular-nums leading-none text-foreground mb-1">{value}</p>
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      {/* Progress ring visual */}
      <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", a.ring)}
          style={{ width: `${parseFloat(value)}%` }}
        />
      </div>
    </div>
  );
}

const ATTENDANCE_STYLE: Record<string, string> = {
  PRESENT: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40",
  ABSENT:  "text-red-500 dark:text-red-400 bg-red-100/60 dark:bg-red-950/30",
  LATE:    "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40",
  EXCUSED: "text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-950/40",
};

export default function ProgressDashboardPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/progress", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        { label: "Submission Rate", value: `${data.submissionRate}`, sub: `${data.submittedTasks}/${data.totalTasks} tasks`, icon: <RiCheckboxCircleLine />, accent: "teal" as Accent },
        { label: "Average Score",   value: `${data.averageScore}`, sub: "out of 100", icon: <RiBarChartBoxLine />, accent: "violet" as Accent },
        { label: "Attendance Rate", value: `${data.attendanceRate}`, sub: `${data.presentAttendance}/${data.totalAttendance} sessions`, icon: <RiCalendarCheckLine />, accent: "amber" as Accent },
      ]
    : [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-5 lg:p-7 pt-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">
            My Progress
          </span>
        </div>
        <h1 className="text-[1.55rem] font-extrabold tracking-tight leading-none text-foreground">
          Progress Dashboard
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Your academic performance at a glance
        </p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          {/* Session Timeline */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-[14.5px] font-bold text-foreground leading-none mb-0.5">Session Timeline</h2>
                <p className="text-[12px] text-muted-foreground">Your attendance history</p>
              </div>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {data.sessionTimeline.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">No sessions yet</div>
              ) : (
                data.sessionTimeline.map((s) => (
                  <div key={s.sessionId} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors duration-100">
                    <div className={cn("w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm", ATTENDANCE_STYLE[s.attendanceStatus] ?? "bg-muted text-muted-foreground")}>
                      <RiCalendarCheckLine />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{s.sessionTitle}</p>
                      <p className="text-[11.5px] text-muted-foreground flex items-center gap-1">
                        <RiFlaskLine className="text-xs" />
                        {s.cluster.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={cn("text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full", ATTENDANCE_STYLE[s.attendanceStatus] ?? "bg-muted text-muted-foreground")}>
                        {s.attendanceStatus}
                      </span>
                      <span className="text-[11px] text-muted-foreground/55 flex items-center gap-0.5">
                        <RiTimeLine className="text-xs" />
                        {new Date(s.scheduledAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Badges */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[14.5px] font-bold text-foreground leading-none mb-0.5">Badges</h2>
                <p className="text-[12px] text-muted-foreground">{data.badges.length} earned</p>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {data.badges.length === 0 ? (
                  <p className="text-[12.5px] text-muted-foreground py-4 w-full text-center">No badges yet — keep going!</p>
                ) : (
                  data.badges.map((b) => (
                    <div
                      key={b.id}
                      title={b.milestone.name}
                      className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border border-amber-200/70 dark:border-amber-800/50 bg-amber-100/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                    >
                      <span className="text-xl">{b.milestone.badgeIcon ?? "🏆"}</span>
                      <span className="text-[10px] font-bold text-center leading-tight max-w-[60px]">
                        {b.milestone.name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Homework */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[14.5px] font-bold text-foreground leading-none mb-0.5">Pending Homework</h2>
                <p className="text-[12px] text-muted-foreground">{data.pendingHomework.length} items</p>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {data.pendingHomework.length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <RiTrophyLine className="text-2xl text-teal-500 mx-auto mb-1" />
                    <p className="text-[12.5px] text-muted-foreground">All homework done! 🎉</p>
                  </div>
                ) : (
                  data.pendingHomework.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 px-5 py-3.5">
                      <div className="mt-0.5 w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-sm bg-amber-100/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                        <RiBookLine />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-foreground truncate">{h.title}</p>
                        <p className="text-[11.5px] text-muted-foreground truncate">{h.StudySession.title}</p>
                        {h.deadline && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-0.5">
                            <RiTimeLine className="text-xs" />
                            Due {new Date(h.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
