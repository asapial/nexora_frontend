"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiSparklingFill, RiArrowLeftLine, RiCalendarLine, RiGroupLine,
  RiCheckboxCircleLine, RiAlertLine, RiTimeLine, RiMapPinLine,
  RiRefreshLine, RiLoader4Line, RiSendPlaneLine, RiCheckLine,
  RiFlaskLine, RiFileTextLine, RiUserLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type SessionStatus = "upcoming" | "ongoing" | "completed";
type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED";

interface Session {
  id: string; title: string; description: string | null;
  scheduledAt: string; status: SessionStatus;
  durationMins: number | null; location: string | null; taskDeadline: string | null;
  cluster: { id: string; name: string; batchTag: string | null };
  tasks: Array<{ id: string; title: string; status: string; submission: { id: string } | null }>;
  attendance: Array<{ studentProfileId: string; status: string }>;
}
interface AttendanceRecord {
  studentId: string; name: string; email: string; status: AttendanceStatus; note?: string; markedAt: string;
}

const INP = "w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";

const SESSION_STATUS_OPTIONS: { value: SessionStatus; label: string; cls: string }[] = [
  { value: "upcoming",  label: "Upcoming",  cls: "text-sky-600 dark:text-sky-400 border-sky-200/70" },
  { value: "ongoing",   label: "Ongoing",   cls: "text-teal-600 dark:text-teal-400 border-teal-200/70" },
  { value: "completed", label: "Completed", cls: "text-muted-foreground border-border" },
];

export default function ManageSessionPage() {
  const router = useRouter();
  const { sessionId } = useParams() as { sessionId: string };

  const [session, setSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update form state
  const [title, setTitle]           = useState("");
  const [desc, setDesc]             = useState("");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("upcoming");
  const [location, setLocation]     = useState("");
  const [deadline, setDeadline]     = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sRes, aRes] = await Promise.all([
        fetch(`/api/sessions/${sessionId}`, { credentials: "include" }),
        fetch(`/api/sessions/${sessionId}/attendance`, { credentials: "include" }),
      ]);
      const sData = await sRes.json();
      const aData = await aRes.json();
      if (sData.success) {
        const s = sData.data;
        setSession(s);
        setTitle(s.title);
        setDesc(s.description ?? "");
        setSessionStatus(s.status);
        setLocation(s.location ?? "");
        setDeadline(s.taskDeadline ? new Date(s.taskDeadline).toISOString().slice(0, 16) : "");
      } else setError(sData.message);
      if (aData.success) setAttendance(aData.data.records ?? []);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description: desc || null, status: sessionStatus,
          location: location || null, deadline: deadline || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      setSaveMsg("✓ Session updated successfully");
      fetchAll();
    } catch (e: unknown) { setSaveMsg(`Error: ${e instanceof Error ? e.message : "Update failed"}`); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full animate-pulse">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-8 w-2/3 rounded-xl bg-muted" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted/60" />)}
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <RiAlertLine className="text-4xl text-red-500" />
        <p className="text-[14px] font-bold">{error ?? "Session not found"}</p>
        <button onClick={fetchAll} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-600 text-white text-[13px] font-bold hover:bg-teal-700">
          <RiRefreshLine /> Retry
        </button>
      </div>
    );
  }

  const submittedCount = (session.tasks ?? []).filter(t => t.status === "SUBMITTED" || t.status === "REVIEWED").length;
  const reviewedCount  = (session.tasks ?? []).filter(t => t.status === "REVIEWED").length;
  const dueTasks       = (session.tasks ?? []).filter(t => t.status === "PENDING");

  const ATTENDANCE_CFG = {
    PRESENT: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70",
    ABSENT:  "bg-red-100/70 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70",
    EXCUSED: "bg-amber-100/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/70",
  };

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full">
      {/* Back */}
      <button onClick={() => router.push("/dashboard/teacher/session")}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
        <RiArrowLeftLine /> Sessions
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Manage Session</span>
          </div>
          <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground leading-tight">{session.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1"><RiFlaskLine className="text-xs text-teal-600 dark:text-teal-400" />{session.cluster.name}</span>
            {session.cluster.batchTag && <span className="text-[11px]">{session.cluster.batchTag}</span>}
            <span className="flex items-center gap-1"><RiCalendarLine className="text-xs" />{new Date(session.scheduledAt).toLocaleDateString()}</span>
          </div>
        </div>
        <button onClick={fetchAll} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex-shrink-0">
          <RiRefreshLine className="text-sm" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <RiGroupLine />, label: "Total Tasks", value: (session.tasks ?? []).length, cls: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/40" },
          { icon: <RiCheckboxCircleLine />, label: "Submitted", value: submittedCount, cls: "text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/40" },
          { icon: <RiCheckLine />, label: "Reviewed", value: reviewedCount, cls: "text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/40" },
          { icon: <RiUserLine />, label: "Attended", value: attendance.filter(a => a.status === "PRESENT").length, cls: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5", s.cls)}>{s.icon}</div>
            <p className="text-[1.4rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{s.value}</p>
            <p className="text-[12px] font-medium text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Update Session Form ── */}
        <form onSubmit={handleUpdate} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
          <p className="text-[14px] font-bold text-foreground flex items-center gap-2"><RiCalendarLine /> Update Session</p>

          <div>
            <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={INP} />
          </div>
          <div>
            <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
              className="w-full rounded-xl px-4 py-3 text-[13.5px] leading-relaxed resize-none bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
          </div>
          <div>
            <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">Status</label>
            <div className="flex gap-2">
              {SESSION_STATUS_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setSessionStatus(opt.value)}
                  className={cn("flex-1 h-9 rounded-xl border text-[12px] font-semibold transition-all",
                    sessionStatus === opt.value ? "bg-teal-600 text-white border-teal-600" : "border-border text-muted-foreground hover:bg-muted/40")}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Room 301" className={INP} />
          </div>
          <div>
            <label className="text-[12.5px] font-semibold text-foreground/70 mb-1.5 block">Task Deadline</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className={INP} />
          </div>

          {saveMsg && (
            <p className={cn("text-[12.5px] font-medium", saveMsg.startsWith("Error") ? "text-red-500" : "text-teal-600 dark:text-teal-400")}>{saveMsg}</p>
          )}

          <button type="submit" disabled={saving}
            className="inline-flex items-center justify-center gap-2 h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold shadow-sm transition-all disabled:opacity-60">
            {saving ? <RiLoader4Line className="animate-spin" /> : <RiSendPlaneLine />}
            {saving ? "Saving…" : "Update Session"}
          </button>
        </form>

        {/* ── Cluster Info ── */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[14px] font-bold text-foreground mb-4 flex items-center gap-2"><RiFlaskLine /> Cluster Info</p>
            <dl className="flex flex-col gap-2 text-[13px]">
              {[
                { label: "Name", value: session.cluster.name },
                { label: "Batch Tag", value: session.cluster.batchTag ?? "—" },
                { label: "Scheduled", value: new Date(session.scheduledAt).toLocaleString() },
                { label: "Duration", value: session.durationMins ? `${session.durationMins} min` : "—" },
                { label: "Location", value: session.location ?? "—" },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <dt className="text-muted-foreground font-medium w-24 flex-shrink-0">{r.label}</dt>
                  <dd className="text-foreground font-semibold">{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Due tasks (pending) */}
          {dueTasks.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
                <RiTimeLine className="text-amber-500" /> Due Tasks ({dueTasks.length})
              </p>
              <div className="flex flex-col gap-2">
                {dueTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50">
                    <RiFileTextLine className="text-amber-500 text-sm flex-shrink-0" />
                    <p className="text-[12.5px] font-medium text-foreground truncate">{t.title}</p>
                  </div>
                ))}
                {dueTasks.length > 5 && (
                  <p className="text-[11.5px] text-muted-foreground pl-1">+{dueTasks.length - 5} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendance */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <RiUserLine className="text-teal-600 dark:text-teal-400" />
          <p className="text-[14px] font-bold text-foreground">Attendance</p>
          <span className="ml-auto text-[12px] text-muted-foreground">{attendance.length} records</span>
        </div>
        {attendance.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-muted-foreground italic text-center">No attendance recorded yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {attendance.map((a, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{a.name}</p>
                  <p className="text-[11.5px] text-muted-foreground">{a.email}</p>
                </div>
                <span className={cn("text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", ATTENDANCE_CFG[a.status as AttendanceStatus] ?? "border-border text-muted-foreground")}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
