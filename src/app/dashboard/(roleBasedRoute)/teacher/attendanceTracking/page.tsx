"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  RiCalendarCheckLine, RiGroupLine, RiSparklingFill,
  RiCheckLine, RiCloseLine, RiSubtractLine, RiSaveLine,
  RiHistoryLine, RiLoader4Line, RiAlertLine, RiRefreshLine,
  RiSettings3Line,
  RiFileWarningLine, 
  // RiWarningLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────
type Status = "PRESENT" | "ABSENT" | "EXCUSED" | "UNMARKED";

interface ATRecord { memberId: string; status: Status; note: string }
interface Member { studentProfileId: string; userId: string; name: string; email: string; image: string | null }
interface Session { id: string; title: string; scheduledAt: string; status: string; clusterId: string; cluster: { id: string; name: string } }
interface HistEntry { status: Status; session: { title: string; scheduledAt: string } }

// ─── Config ───────────────────────────────────────────────
const STATUS_CONFIG: Record<Status, { label: string; icon: React.ReactNode; activeClass: string; dotClass: string }> = {
  PRESENT:  { label: "Present",  icon: <RiCheckLine />,     activeClass: "border-teal-400 bg-teal-600 text-white",    dotClass: "bg-teal-500" },
  ABSENT:   { label: "Absent",   icon: <RiCloseLine />,     activeClass: "border-red-400 bg-red-600 text-white",      dotClass: "bg-red-500"  },
  EXCUSED:  { label: "Excused",  icon: <RiSubtractLine />,  activeClass: "border-amber-400 bg-amber-500 text-white",  dotClass: "bg-amber-400"},
  UNMARKED: { label: "—",        icon: null,                activeClass: "",                                           dotClass: "bg-muted-foreground/30" },
};

const initials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
const fmtDate  = (d: string) => { try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };
const pct      = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);

// ─── Status toggle button ─────────────────────────────────
function StatusBtn({ status, current, onClick }: { status: Status; current: Status; onClick: () => void }) {
  const cfg = STATUS_CONFIG[status];
  const isActive = status === current;
  if (status === "UNMARKED") return null;
  return (
    <button type="button" onClick={onClick}
      className={cn("w-8 h-8 rounded-lg border-2 flex items-center justify-center text-base transition-all duration-150",
        isActive ? cfg.activeClass : "border-border text-muted-foreground/50 hover:border-border/80 hover:text-foreground hover:bg-muted/50"
      )}>
      {cfg.icon}
    </button>
  );
}

// ─── Attendance rate bar ───────────────────────────────────
function RateBar({ records }: { records: ATRecord[] }) {
  const present  = records.filter(r => r.status === "PRESENT").length;
  const excused  = records.filter(r => r.status === "EXCUSED").length;
  const absent   = records.filter(r => r.status === "ABSENT").length;
  const unmarked = records.filter(r => r.status === "UNMARKED").length;
  const total    = records.length;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[12.5px] font-semibold text-foreground">
        <span>Session attendance</span>
        <span className={cn(total === unmarked ? "text-muted-foreground" : pct(present, total) >= 80 ? "text-teal-600 dark:text-teal-400" : pct(present, total) >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400")}>
          {total === unmarked ? "Not marked yet" : `${pct(present, total)}% present`}
        </span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden flex gap-0.5">
        {total > 0 && [
          { count: present,  color: "bg-teal-500" },
          { count: excused,  color: "bg-amber-400" },
          { count: absent,   color: "bg-red-400" },
          { count: unmarked, color: "bg-muted-foreground/20" },
        ].map((seg, i) => seg.count > 0 && (
          <div key={i} className={cn("h-full transition-all duration-700", seg.color)} style={{ width: `${pct(seg.count, total)}%` }} />
        ))}
      </div>
      <div className="flex gap-4 text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-teal-500" />Present: {present}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400" />Excused: {excused}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400" />Absent: {absent}</span>
        {unmarked > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted-foreground/30" />Unmarked: {unmarked}</span>}
      </div>
    </div>
  );
}

// ─── Cluster selector with real data ──────────────────────
export default function AttendanceTrackingPage() {
  // ── cluster/session selection
  const [clusters,  setClusters]  = useState<{id:string;name:string}[]>([]);
  const [clusterId, setClusterId] = useState("");
  const [sessions,  setSessions]  = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [members,   setMembers]   = useState<Member[]>([]);
  const [history,   setHistory]   = useState<Record<string, HistEntry[]>>({});

  // ── attendance records [key = memberStudentProfileId]
  const [records,   setRecords]   = useState<Record<string, ATRecord>>({});

  // ── ui states
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMembers,  setLoadingMembers]  = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [loadingHistory,  setLoadingHistory]  = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ── absent warning config
  const [showWarningCfg, setShowWarningCfg]   = useState(false);
  const [absentThreshold, setAbsentThreshold] = useState(3);
  const [warningMsg, setWarningMsg]           = useState("This student has excessive absences and may need immediate attention.");

  // ── absent warning config — load from backend
  useEffect(() => {
    fetch("/api/sessions/attendance-warning-config", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const cfg = d.data ?? {};
        if (cfg.threshold) setAbsentThreshold(cfg.threshold);
        if (cfg.message) setWarningMsg(cfg.message);
      })
      .catch(() => {});
  }, []);

  const activeSession = sessions.find(s => s.id === sessionId) ?? sessions[0];

  // ── Fetch clusters
  const fetchClusters = useCallback(async () => {
    setLoadingClusters(true);
    try {
      const res = await fetch("/api/cluster", { credentials: "include" });
      const d = await res.json();
      const list = (d.data ?? d) as {id:string;name:string}[];
      setClusters(list);
      if (list.length > 0) setClusterId(list[0].id);
    } catch { toast.error("Failed to load clusters"); }
    finally { setLoadingClusters(false); }
  }, []);

  useEffect(() => { fetchClusters(); }, [fetchClusters]);

  // ── Fetch sessions when cluster changes
  useEffect(() => {
    if (!clusterId) return;
    setLoadingSessions(true); setSessions([]); setSessionId(""); setMembers([]); setRecords({});
    fetch(`/api/sessions?clusterId=${clusterId}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        const list = (d.data ?? d) as Session[];
        setSessions(list);
        if (list.length > 0) setSessionId(list[0].id);
      })
      .catch(() => toast.error("Failed to load sessions"))
      .finally(() => setLoadingSessions(false));
  }, [clusterId]);

  // ── Fetch members + existing attendance when session changes
  useEffect(() => {
    if (!activeSession?.id) return;
    setLoadingMembers(true); setMembers([]); setRecords({});
    fetch(`/api/teacher/tasks/sessions/${activeSession.id}/members`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        const list = (d.data ?? []) as Member[];
        setMembers(list);
        // init all as UNMARKED
        const init: Record<string, ATRecord> = {};
        list.forEach(m => { init[m.studentProfileId] = { memberId: m.studentProfileId, status: "UNMARKED", note: "" }; });
        setRecords(init);
      })
      .catch(() => toast.error("Failed to load members"))
      .finally(() => setLoadingMembers(false));

    // Fetch existing attendance for this session
    setLoadingExisting(true);
    fetch(`/api/sessions/${activeSession.id}/attendance`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        const recList = (d.data?.records ?? d.data ?? []) as Array<{studentId:string;status:string;note?:string}>;
        if (recList.length) {
          setRecords(prev => {
            const next = { ...prev };
            recList.forEach(r => {
              if (next[r.studentId]) {
                next[r.studentId] = { memberId: r.studentId, status: r.status as Status, note: r.note ?? "" };
              }
            });
            return next;
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingExisting(false));
  }, [activeSession?.id]);

  // ── Fetch history when showHistory turned on
  useEffect(() => {
    if (!showHistory || !members.length || !clusterId) return;
    setLoadingHistory(true);
    const validMembers = members.filter(m => m.studentProfileId);
    if (validMembers.length === 0) {
      setLoadingHistory(false);
      return;
    }
    Promise.all(validMembers.map(async m => {
      try {
        const res = await fetch(`/api/sessions/students/${m.studentProfileId}/attendance-history?clusterId=${clusterId}`, { credentials: "include" });
        if (!res.ok) {
          console.warn(`Attendance history failed for ${m.studentProfileId}:`, res.status);
          return { id: m.studentProfileId, entries: [] as HistEntry[] };
        }
        const d = await res.json();
        return { id: m.studentProfileId, entries: (d.data ?? []) as HistEntry[] };
      } catch (err) {
        console.warn(`Attendance history error for ${m.studentProfileId}:`, err);
        return { id: m.studentProfileId, entries: [] as HistEntry[] };
      }
    }))
      .then(results => {
        const h: Record<string, HistEntry[]> = {};
        results.forEach(r => { h[r.id] = r.entries; });
        setHistory(h);
      })
      .finally(() => setLoadingHistory(false));
  }, [showHistory, members, clusterId]);

  // ── Record helpers
  const sessionRecords = useMemo(() => members.map(m => records[m.studentProfileId] ?? { memberId: m.studentProfileId, status: "UNMARKED" as Status, note: "" }), [members, records]);

  const setStatus = (memberId: string, status: Status) =>
    setRecords(r => ({ ...r, [memberId]: { ...r[memberId], memberId, status } }));
  const setNote = (memberId: string, note: string) =>
    setRecords(r => ({ ...r, [memberId]: { ...r[memberId], memberId, note } }));
  const markAll = (status: Status) => members.forEach(m => setStatus(m.studentProfileId, status));

  // ── Save
  const handleSave = async () => {
    if (!activeSession) return;
    setSaving(true);
    try {
      const payload = {
        attendance: members.map(m => ({
          studentId: m.studentProfileId,
          status: records[m.studentProfileId]?.status ?? "UNMARKED",
          note: records[m.studentProfileId]?.note ?? "",
        })).filter(r => r.status !== "UNMARKED"),
      };
      const res = await fetch(`/api/sessions/${activeSession.id}/attendance`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Save failed");
      toast.success("Attendance saved!");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  // ── Absent count per member (across history)
  const absentCount = (memberId: string) => (history[memberId] ?? []).filter(h => h.status === "ABSENT").length;
  const isWarned    = (memberId: string) => absentCount(memberId) >= absentThreshold;

  const markedCount = sessionRecords.filter(r => r.status !== "UNMARKED").length;

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Sessions</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Attendance Tracking</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowWarningCfg(s => !s)}
            className={cn("inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-[12.5px] font-semibold transition-all",
              showWarningCfg ? "border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
            <RiSettings3Line /> Warning Config
          </button>
          <button onClick={() => setShowHistory(s => !s)}
            className={cn("inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-[12.5px] font-semibold transition-all",
              showHistory ? "border-teal-300/60 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
            <RiHistoryLine /> {showHistory ? "Hide" : "Show"} history
          </button>
        </div>
      </div>

      {/* Warning config panel */}
      {showWarningCfg && (
        <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20 px-5 py-4 flex flex-col gap-3">
          <p className="text-[13px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2"><RiFileWarningLine /> Absence Warning Configuration</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-foreground/70">Absent threshold (sessions)</label>
              <input type="number" min="1" max="20" value={absentThreshold} onChange={e => setAbsentThreshold(parseInt(e.target.value) || 1)}
                className="w-24 h-9 px-3 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400/70 transition-all" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-foreground/70">Warning message shown to teacher</label>
              <input value={warningMsg} onChange={e => setWarningMsg(e.target.value)}
                className="w-full h-9 px-3 rounded-xl text-[13px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400/70 transition-all" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11.5px] text-amber-600/80 dark:text-amber-400/60">Students with ≥ {absentThreshold} absences in their history will show a warning badge below.</p>
            <button
              onClick={() => {
                fetch("/api/sessions/attendance-warning-config", {
                  method: "PUT",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ threshold: absentThreshold, message: warningMsg }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    if (!d.success) throw new Error(d.message || "Save failed");
                    toast.success("Warning config saved!");
                  })
                  .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Save failed"));
              }}
              className="flex-shrink-0 ml-4 inline-flex items-center gap-1.5 h-8 px-4 rounded-xl text-[12px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all">
              <RiSaveLine /> Save config
            </button>
          </div>
        </div>
      )}

      {/* Session selector */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground/80">Cluster</label>
            {loadingClusters ? (
              <div className="h-10 rounded-xl bg-muted animate-pulse" />
            ) : (
              <select value={clusterId} onChange={e => { setClusterId(e.target.value); setSessionId(""); }}
                className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all">
                {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground/80">Session</label>
            {loadingSessions ? (
              <div className="h-10 rounded-xl bg-muted animate-pulse" />
            ) : (
              <select value={activeSession?.id ?? ""} onChange={e => setSessionId(e.target.value)}
                className="w-full h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all">
                {sessions.map(s => <option key={s.id} value={s.id}>{s.title} · {fmtDate(s.scheduledAt)}</option>)}
              </select>
            )}
          </div>
        </div>
        {activeSession && !loadingMembers && !loadingExisting && <RateBar records={sessionRecords} />}
      </div>

      {/* Members table */}
      {activeSession && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <RiGroupLine className="text-muted-foreground/60 text-base" />
              <span className="text-[13px] font-bold text-foreground">{members.length} members</span>
              {(loadingMembers || loadingExisting) && <RiLoader4Line className="text-muted-foreground text-sm animate-spin" />}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground mr-1">Mark all:</span>
              {(["PRESENT", "ABSENT", "EXCUSED"] as Status[]).map(s => (
                <button key={s} type="button" onClick={() => markAll(s)}
                  className={cn("h-7 px-3 rounded-lg text-[11.5px] font-bold border transition-all",
                    s === "PRESENT" ? "border-teal-300/60 dark:border-teal-700/50 text-teal-700 dark:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-teal-950/30"
                    : s === "ABSENT" ? "border-red-300/60 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/30"
                    : "border-amber-300/60 dark:border-amber-700/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/30"
                  )}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Member rows */}
          {loadingMembers ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/60 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-2.5 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : members.length === 0 ? (
            <p className="px-5 py-8 text-[13px] text-muted-foreground italic text-center">No members in this session.</p>
          ) : members.map(member => {
            const rec    = records[member.studentProfileId] ?? { memberId: member.studentProfileId, status: "UNMARKED" as Status, note: "" };
            const status = rec.status;
            const note   = rec.note;
            const warned = showHistory && isWarned(member.studentProfileId);

            return (
              <div key={member.studentProfileId} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
                {/* Warning banner */}
                {warned && (
                  <div className="mx-5 mt-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50">
                    <RiAlertLine className="text-amber-500 text-sm mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11.5px] font-bold text-amber-700 dark:text-amber-400">
                        {absentCount(member.studentProfileId)} absences — above threshold ({absentThreshold})
                      </p>
                      <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70">{warningMsg}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 px-5 py-3.5">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[12px] bg-teal-600/15 dark:bg-teal-400/12 text-teal-700 dark:text-teal-300 border border-teal-300/50 dark:border-teal-600/30 overflow-hidden">
                    {member.image
                      ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                      : initials(member.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-foreground">{member.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">{member.email}</p>
                  </div>

                  {/* Status buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(["PRESENT", "EXCUSED", "ABSENT"] as Status[]).map(s => (
                      <StatusBtn key={s} status={s} current={status} onClick={() => setStatus(member.studentProfileId, s)} />
                    ))}
                  </div>

                  {/* Status label */}
                  <div className={cn("w-20 text-center text-[11.5px] font-bold flex-shrink-0 hidden sm:block",
                    status === "PRESENT" ? "text-teal-600 dark:text-teal-400"
                    : status === "ABSENT" ? "text-red-500 dark:text-red-400"
                    : status === "EXCUSED" ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground/40")}>
                    {STATUS_CONFIG[status].label}
                  </div>
                </div>

                {/* Note input */}
                <div className="px-5 pb-3">
                  <input value={note} onChange={e => setNote(member.studentProfileId, e.target.value)} placeholder="Add a note (optional)…"
                    className="w-full h-8 px-3 rounded-lg text-[12.5px] bg-muted/30 border border-border/60 text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-teal-400/25 focus:border-teal-400/50 transition-all" />
                </div>

                {/* History row */}
                {showHistory && (
                  <div className="px-5 pb-3 flex items-center gap-3">
                    <span className="text-[11.5px] font-semibold text-muted-foreground/70 flex-shrink-0">History:</span>
                    {loadingHistory ? (
                      <span className="text-[11.5px] text-muted-foreground/40">Loading…</span>
                    ) : (history[member.studentProfileId] ?? []).length === 0 ? (
                      <span className="text-[11.5px] text-muted-foreground/40">No history</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {(history[member.studentProfileId] ?? []).slice(0, 10).map((e, i) => (
                            <div key={i}
                              title={`${e.session?.title} · ${fmtDate(e.session?.scheduledAt ?? "")} · ${e.status}`}
                              className={cn("w-3 h-3 rounded-sm transition-all", STATUS_CONFIG[e.status]?.dotClass ?? "bg-muted-foreground/30")} />
                          ))}
                        </div>
                        {(() => {
                          const hist = history[member.studentProfileId] ?? [];
                          const p = hist.filter(e => e.status === "PRESENT").length;
                          const r = pct(p, hist.length);
                          return (
                            <span className={cn("text-[11.5px] font-bold tabular-nums", r >= 80 ? "text-teal-600 dark:text-teal-400" : r >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400")}>
                              {r}%
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Save footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/20">
            <p className="text-[12.5px] text-muted-foreground">
              {markedCount}/{members.length} marked
            </p>
            <button onClick={handleSave} disabled={saving || !activeSession}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-xl text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 bg-teal-600 hover:bg-teal-700 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                : <><RiSaveLine />Save attendance</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}