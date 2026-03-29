"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiSparklingFill, RiCalendarLine, RiGroupLine, RiCheckLine,
  RiFileTextLine, RiSearchLine, RiRefreshLine, RiDownloadLine,
  RiFilterLine, RiLoader4Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { teacherDashApi } from "@/lib/api";
import { toast } from "sonner";
import { AmbientBg2, AmbientBg6 } from "@/components/backgrounds/AmbientBg";

type Session = {
  id: string;
  title: string;
  scheduledAt: string;
  durationMins?: number;
  status: string;
  cluster: { id: string; name: string };
  attendanceCount: number;
  attendanceRate: number;
  taskCount: number;
  taskSubmissionRate: number;
};

type Cluster = { id: string; name: string };

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_120px_80px_80px_80px] gap-4 px-5 py-4 border-b border-border/60 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-3 bg-muted rounded" />
      ))}
    </div>
  );
}

function RateBar({ value }: { value: number }) {
  const col =
    value >= 80 ? "bg-teal-500" : value >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", col)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[12px] font-semibold tabular-nums text-foreground w-9">{value}%</span>
    </div>
  );
}

export default function TeacherSessionHistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clusterId, setClusterId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        teacherDashApi.getSessionHistory({ clusterId: clusterId || undefined, from: from || undefined, to: to || undefined }),
        teacherDashApi.getClusters(),
      ]);
      setSessions(Array.isArray(s.data?.data) ? s.data.data : Array.isArray(s.data) ? s.data : []);
      setClusters(Array.isArray(c.data) ? c.data : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [clusterId, from, to]);

  useEffect(() => { load(); }, [load]);

  const filtered = sessions.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.cluster.name.toLowerCase().includes(search.toLowerCase())
  );

  const exportPDF = () => { window.print(); };

  const avgAttendance = sessions.length
    ? Math.round(sessions.reduce((s, x) => s + x.attendanceRate, 0) / sessions.length)
    : 0;
  const avgSubmission = sessions.length
    ? Math.round(sessions.reduce((s, x) => s + x.taskSubmissionRate, 0) / sessions.length)
    : 0;

  const INP =
    "h-9 px-3 rounded-xl text-[12.5px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all";

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full" ref={printRef}>

      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Teacher</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Session History</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Past sessions with attendance and task submission metrics</p>
          </div>
          <div className="flex gap-2 shrink-0 print:hidden">
            <button onClick={load}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
              <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
            </button>
            <button onClick={exportPDF}
              className="h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[12.5px] font-bold flex items-center gap-1.5 transition-all">
              <RiDownloadLine /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <RiCalendarLine />, label: "Sessions", val: sessions.length, color: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60" },
          { icon: <RiGroupLine />, label: "Avg Attendance", val: `${avgAttendance}%`, color: "text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-950/40 border-sky-200/60" },
          { icon: <RiCheckLine />, label: "Avg Submission", val: `${avgSubmission}%`, color: "text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60" },
          { icon: <RiFileTextLine />, label: "Total Tasks", val: sessions.reduce((s, x) => s + x.taskCount, 0), color: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5", s.color)}>{s.icon}</div>
            <p className="text-[1.25rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{s.val}</p>
            <p className="text-[12px] font-medium text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none text-sm" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions…"
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[13px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all" />
        </div>
        <select value={clusterId} onChange={e => setClusterId(e.target.value)}
          className="h-10 px-3 rounded-xl text-[12.5px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all">
          <option value="">All clusters</option>
          {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={INP} />
          <span className="text-muted-foreground text-sm">–</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className={INP} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_80px_1fr_1fr] gap-4 px-5 py-3 border-b border-border bg-muted/20">
          {["Session", "Date", "Duration", "Attendance Rate", "Submission Rate"].map(h => (
            <p key={h} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</p>
          ))}
        </div>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          : filtered.length === 0
          ? (
            <div className="py-16 text-center">
              <RiCalendarLine className="text-4xl text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-[13.5px] font-medium text-muted-foreground">No sessions found</p>
            </div>
          )
          : filtered.map(s => (
            <div key={s.id} className="grid grid-cols-[1fr_120px_80px_1fr_1fr] gap-4 px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors items-center">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{s.title}</p>
                <p className="text-[11.5px] text-muted-foreground truncate">{s.cluster.name}</p>
              </div>
              <p className="text-[12.5px] text-muted-foreground">{fmtDate(s.scheduledAt)}</p>
              <p className="text-[12.5px] text-muted-foreground">{s.durationMins ? `${s.durationMins}m` : "—"}</p>
              <RateBar value={s.attendanceRate} />
              <RateBar value={s.taskSubmissionRate} />
            </div>
          ))}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-[12px] text-muted-foreground text-center">
          Showing {filtered.length} of {sessions.length} sessions
        </p>
      )}
    </div>
  );
}
