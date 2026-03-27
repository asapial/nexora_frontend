"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiSparklingFill, RiArrowLeftLine, RiGroupLine, RiFileTextLine,
  RiCalendarLine, RiCheckboxCircleLine, RiTimeLine, RiUserLine,
  RiCheckLine, RiAlertLine, RiRefreshLine, RiFlaskLine,
  RiStarLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type AttStatus = "PRESENT" | "ABSENT" | "EXCUSED";
type TaskStatus = "PENDING" | "SUBMITTED" | "REVIEWED";

interface Member { userId: string; name: string; email: string; image: string | null; joinedAt: string; subtype: string }
interface SessionTile { id: string; title: string; scheduledAt: string; status: string; durationMins: number | null }
interface MyTask {
  id: string; title: string; status: TaskStatus; deadline: string | null; finalScore: number | null;
  submission: { id: string; submittedAt: string } | null;
  StudySession: { id: string; title: string; scheduledAt: string; status: string };
}
interface MyAtt {
  status: AttStatus; note: string | null; markedAt: string;
  StudySession: { id: string; title: string; scheduledAt: string };
}
interface ClusterDetail {
  id: string; name: string; description: string | null; batchTag: string | null;
  healthScore: number | null; healthStatus: string | null; isActive: boolean;
  teacher: { name: string; email: string; image: string | null } | null;
  memberCount: number; sessionCount: number;
  members: Member[];
  sessions: SessionTile[];
  myTasks: MyTask[];
  myAttendance: MyAtt[];
  joinedAt: string; subtype: string;
}

type Tab = "overview" | "members" | "tasks" | "attendance";

const TASK_STATUS: Record<TaskStatus, string> = {
  PENDING:   "bg-sky-100/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",
  SUBMITTED: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
  REVIEWED:  "bg-violet-100/80 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50",
};
const ATT_STATUS: Record<AttStatus, string> = {
  PRESENT: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70",
  ABSENT:  "bg-red-100/70 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70",
  EXCUSED: "bg-amber-100/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/70",
};

export default function StudentClusterDetailPage() {
  const router = useRouter();
  const { clusterId } = useParams() as { clusterId: string };

  const [cluster, setCluster] = useState<ClusterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState<Tab>("overview");

  const fetchCluster = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/student/clusters/${clusterId}`, { credentials: "include" });
      const d = await res.json();
      if (d.success) setCluster(d.data);
      else throw new Error(d.message || "Failed to load cluster");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, [clusterId]);

  useEffect(() => { fetchCluster(); }, [fetchCluster]);

  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full animate-pulse">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-8 w-2/3 rounded-xl bg-muted" />
        <div className="h-24 rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (error || !cluster) {
    return (
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <RiAlertLine className="text-4xl text-red-500" />
        <p className="text-[14px] font-bold">{error ?? "Cluster not found"}</p>
        <button onClick={fetchCluster} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-600 text-white text-[13px] font-bold hover:bg-teal-700">
          <RiRefreshLine /> Retry
        </button>
      </div>
    );
  }

  const doneTaskCount = cluster.myTasks.filter(t => t.status === "SUBMITTED" || t.status === "REVIEWED").length;
  const presentCount  = cluster.myAttendance.filter(a => a.status === "PRESENT").length;

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "overview",    label: "Overview",    icon: <RiFlaskLine />,             count: undefined },
    { key: "members",     label: "Members",     icon: <RiGroupLine />,             count: cluster.memberCount },
    { key: "tasks",       label: "My Tasks",    icon: <RiFileTextLine />,          count: cluster.myTasks.length },
    { key: "attendance",  label: "Attendance",  icon: <RiCalendarLine />,          count: cluster.myAttendance.length },
  ];

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full">
      {/* Back */}
      <button onClick={() => router.push("/dashboard/student/cluster")}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
        <RiArrowLeftLine /> My Clusters
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Cluster</span>
          </div>
          <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground leading-tight">{cluster.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-[12px] text-muted-foreground">
            {cluster.batchTag && <span className="px-2 py-0.5 rounded-md bg-muted/60 border border-border text-[11px] font-semibold">{cluster.batchTag}</span>}
            {cluster.teacher && <span className="flex items-center gap-1"><RiUserLine className="text-xs" />{cluster.teacher.name}</span>}
            <span className={cn("text-[11px] font-semibold", cluster.isActive ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground")}>
              {cluster.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <button onClick={fetchCluster} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex-shrink-0">
          <RiRefreshLine className="text-sm" />
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { v: cluster.memberCount,     l: "Members",   cls: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/40",   i: <RiGroupLine /> },
          { v: cluster.sessionCount,    l: "Sessions",  cls: "text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/40",         i: <RiCalendarLine /> },
          { v: `${doneTaskCount}/${cluster.myTasks.length}`, l: "Tasks Done",  cls: "text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/40", i: <RiCheckboxCircleLine /> },
          { v: `${presentCount}/${cluster.myAttendance.length}`, l: "Present",     cls: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40", i: <RiCheckLine /> },
        ].map(s => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-4">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5", s.cls)}>{s.i}</div>
            <p className="text-[1.25rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{s.v}</p>
            <p className="text-[12px] font-medium text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-border -mb-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold transition-all -mb-px",
              tab === t.key ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500" : "text-muted-foreground hover:text-foreground")}>
            <span className="text-xs">{t.icon}</span>
            {t.label}
            {t.count !== undefined && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="flex flex-col gap-4">
          {cluster.description && (
            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">About</p>
              <p className="text-[13px] text-foreground/80">{cluster.description}</p>
            </div>
          )}
          {/* Recent sessions */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <p className="text-[13px] font-bold text-foreground">Recent Sessions</p>
            </div>
            {cluster.sessions.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-muted-foreground italic">No sessions yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border/60">
                {cluster.sessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                    <RiCalendarLine className="text-teal-600 dark:text-teal-400 text-sm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{s.title}</p>
                      <p className="text-[11.5px] text-muted-foreground">{new Date(s.scheduledAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border border-border text-muted-foreground">{s.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Members ── */}
      {tab === "members" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex flex-col divide-y divide-border/60">
            {cluster.members.map(m => {
              const initials = m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <div key={m.userId} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-[12px]">
                    {m.image ? <img src={m.image} alt={m.name} className="w-full h-full object-cover" /> : <span>{initials}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{m.name}</p>
                    <p className="text-[11.5px] text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <span className="text-[10px] font-bold tracking-wide uppercase text-muted-foreground">{m.subtype}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── My Tasks ── */}
      {tab === "tasks" && (
        <div className="flex flex-col gap-3">
          {cluster.myTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-10 text-center">
              <RiFileTextLine className="text-3xl text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">No tasks assigned yet.</p>
            </div>
          ) : cluster.myTasks.map(t => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-border bg-card hover:border-teal-200/60 dark:hover:border-teal-800/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-foreground truncate">{t.title}</p>
                <p className="text-[12px] text-muted-foreground">{t.StudySession.title} · {new Date(t.StudySession.scheduledAt).toLocaleDateString()}</p>
                {t.deadline && (
                  <p className="text-[11.5px] text-muted-foreground/70 flex items-center gap-1 mt-0.5"><RiTimeLine className="text-xs" />{new Date(t.deadline).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={cn("text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", TASK_STATUS[t.status])}>{t.status}</span>
                {t.finalScore != null && (
                  <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 flex items-center gap-0.5"><RiStarLine className="text-xs" />{t.finalScore}/10</span>
                )}
                {t.status === "PENDING" && (
                  <button onClick={() => router.push(`/dashboard/student/taskSubmission?taskId=${t.id}`)}
                    className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                    Submit →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Attendance ── */}
      {tab === "attendance" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {cluster.myAttendance.length === 0 ? (
            <p className="px-5 py-8 text-[13px] text-muted-foreground italic text-center">No attendance records yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {cluster.myAttendance.map((a, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{a.StudySession.title}</p>
                    <p className="text-[11.5px] text-muted-foreground">{new Date(a.StudySession.scheduledAt).toLocaleDateString()}</p>
                  </div>
                  <span className={cn("text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", ATT_STATUS[a.status])}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
