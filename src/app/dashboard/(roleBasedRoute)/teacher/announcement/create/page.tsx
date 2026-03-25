"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiMegaphoneLine, RiAddLine, RiCheckLine, RiCloseLine,
  RiSendPlaneLine, RiCalendarLine, RiInformationLine, RiAlertLine, RiErrorWarningLine,
  RiTimeLine, RiFlaskLine, RiDeleteBinLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

type Urgency = "INFO" | "IMPORTANT" | "CRITICAL";
interface Cluster { id: string; name: string; _count: { members: number } }
interface Announcement {
  id: string; title: string; body: string; urgency: Urgency; publishedAt: string | null;
  scheduledAt: string | null; isGlobal: boolean;
  clusters: { cluster: { id: string; name: string } }[];
}

const URGENCY_CFG: Record<Urgency, { icon: React.ReactNode; badge: string; border: string }> = {
  INFO:      { icon: <RiInformationLine />,  badge: "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",      border: "border-sky-300/50 dark:border-sky-700/50" },
  IMPORTANT: { icon: <RiAlertLine />,        badge: "bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50", border: "border-amber-300/50 dark:border-amber-700/50" },
  CRITICAL:  { icon: <RiErrorWarningLine />, badge: "bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50",       border: "border-red-300/50 dark:border-red-700/50" },
};

const INPUT_CLS = "w-full h-10 px-4 rounded-xl text-[13.5px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";

export default function TeacherAnnouncementPage() {
  const [clusters, setClusters]           = useState<Cluster[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);

  // Form state
  const [title, setTitle]           = useState("");
  const [body, setBody]             = useState("");
  const [urgency, setUrgency]       = useState<Urgency>("INFO");
  const [selected, setSelected]     = useState<string[]>([]);
  const [isGlobal, setIsGlobal]     = useState(false);
  const [schedDate, setSchedDate]   = useState("");
  const [schedTime, setSchedTime]   = useState("");
  const [sending, setSending]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [err, setErr]               = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    Promise.all([
      fetch("/api/teacher/announcements/clusters", { credentials: "include" }).then(r => r.json()),
      fetch("/api/teacher/announcements", { credentials: "include" }).then(r => r.json()),
    ]).then(([c, a]) => {
      if (c.success) setClusters(c.data);
      if (a.success) setAnnouncements(a.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleCluster = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { setErr("Title and body are required."); return; }
    if (!isGlobal && selected.length === 0) { setErr("Select at least one cluster or use Global."); return; }
    setSending(true); setErr(null);
    try {
      const scheduledAt = schedDate ? `${schedDate}T${schedTime || "00:00"}` : undefined;
      const res = await fetch("/api/teacher/announcements", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, urgency, clusterIds: selected, isGlobal, scheduledAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setSuccess(true);
      setAnnouncements(prev => [data.data, ...prev]);
      setTimeout(() => {
        setSuccess(false); setShowForm(false);
        setTitle(""); setBody(""); setSelected([]); setSchedDate(""); setSchedTime("");
      }, 1500);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSending(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/teacher/announcements/${id}`, { method: "DELETE", credentials: "include" });
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const totalReach = clusters.filter(c => selected.includes(c.id))
    .reduce((s, c) => s + c._count.members, 0);

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Communication</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Announcements</h1>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 transition-all">
          {showForm ? <RiCloseLine /> : <RiAddLine />} {showForm ? "Close" : "New announcement"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-teal-300/40 dark:border-teal-700/40 bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-teal-50/30 dark:bg-teal-950/10">
            <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400"><RiMegaphoneLine /></div>
            <h2 className="text-[14px] font-bold text-foreground">New Announcement</h2>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
            {/* Left */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Session rescheduled" className={INPUT_CLS} />
              </div>

              {/* Urgency */}
              <div>
                <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Urgency</label>
                <div className="flex gap-2 flex-wrap">
                  {(["INFO", "IMPORTANT", "CRITICAL"] as Urgency[]).map(u => (
                    <button key={u} type="button" onClick={() => setUrgency(u)}
                      className={cn("inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-bold border transition-all",
                        urgency === u ? URGENCY_CFG[u].badge : "border-border text-muted-foreground hover:bg-muted/50")}>
                      <span>{URGENCY_CFG[u].icon}</span>{u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Message *</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
                  placeholder="Write your announcement…"
                  className="w-full rounded-xl px-4 py-3 text-[13.5px] leading-relaxed resize-none bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-foreground/80 mb-1.5 block">Schedule for later <span className="font-normal text-muted-foreground">(optional)</span></label>
                <div className="flex gap-3">
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                    className="flex-1 h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                    className="w-32 h-10 px-3 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
                </div>
              </div>
            </div>

            {/* Right — cluster picker */}
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[13px] font-semibold text-foreground/80 mb-1">Send to clusters</p>
                <label className={cn("flex items-center gap-2.5 p-3 rounded-xl cursor-pointer border transition-all mb-2",
                  isGlobal ? "border-teal-300/60 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-950/20" : "border-border bg-muted/30 hover:bg-muted/50")}>
                  <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    isGlobal ? "border-teal-600 dark:border-teal-400 bg-teal-600 dark:bg-teal-500" : "border-border bg-background")}>
                    {isGlobal && <RiCheckLine className="text-white text-xs" />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={isGlobal} onChange={e => setIsGlobal(e.target.checked)} />
                  <span className="text-[13px] font-semibold text-foreground">All students (Global)</span>
                </label>
              </div>

              {!isGlobal && !loading && clusters.map(c => (
                <label key={c.id} className={cn("flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all",
                  selected.includes(c.id) ? "border-teal-300/60 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-950/20" : "border-border bg-muted/30 hover:bg-muted/50")}>
                  <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    selected.includes(c.id) ? "border-teal-600 dark:border-teal-400 bg-teal-600 dark:bg-teal-500" : "border-border bg-background")}>
                    {selected.includes(c.id) && <RiCheckLine className="text-white text-xs" />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={selected.includes(c.id)} onChange={() => toggleCluster(c.id)} />
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{c.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">{c._count.members} members</p>
                  </div>
                </label>
              ))}

              {!isGlobal && selected.length > 0 && (
                <div className="px-3 py-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-800/40">
                  <p className="text-[12.5px] font-semibold text-teal-700 dark:text-teal-400">
                    {totalReach} member{totalReach !== 1 ? "s" : ""} will be notified
                  </p>
                  {schedDate && (
                    <p className="text-[12px] text-teal-600/70 dark:text-teal-500/70 flex items-center gap-1 mt-0.5">
                      <RiCalendarLine className="text-xs" /> Scheduled: {schedDate} {schedTime}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {err && <p className="px-6 pb-2 text-[12.5px] text-red-500 font-medium">{err}</p>}

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
            <button onClick={handleSend} disabled={sending}
              className={cn("inline-flex items-center gap-2 h-10 px-6 rounded-xl text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 transition-all disabled:opacity-60",
                success ? "bg-teal-600" : "bg-teal-600 hover:bg-teal-700")}>
              {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
               success ? <RiCheckLine /> :
               schedDate ? <RiCalendarLine /> : <RiSendPlaneLine />}
              {sending ? "Sending…" : success ? "Sent!" : schedDate ? `Schedule · ${schedDate}` : "Send now"}
            </button>
          </div>
        </div>
      )}

      {/* Past announcements */}
      <div className="flex flex-col gap-4">
        <p className="text-[12px] font-bold uppercase tracking-[.1em] text-muted-foreground">
          Recent Announcements · {announcements.length}
        </p>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse h-28" />
          ))
        ) : announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <RiMegaphoneLine className="text-3xl text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[13.5px] text-muted-foreground">No announcements yet</p>
          </div>
        ) : (
          announcements.map(a => {
            const u = URGENCY_CFG[a.urgency] ?? URGENCY_CFG.INFO;
            return (
              <div key={a.id} className={cn("rounded-2xl border bg-card overflow-hidden", u.border)}>
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className={cn("w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-base mt-0.5",
                    a.urgency === "INFO" ? "bg-sky-100/70 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400" :
                    a.urgency === "IMPORTANT" ? "bg-amber-100/70 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" :
                    "bg-red-100/70 dark:bg-red-950/30 text-red-600 dark:text-red-400")}>{u.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[14px] font-bold text-foreground">{a.title}</span>
                      <span className={cn("text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border", u.badge)}>{a.urgency}</span>
                    </div>
                    <p className="text-[13px] text-muted-foreground line-clamp-2 mb-2">{a.body}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {a.clusters.map(ac => (
                        <span key={ac.cluster.id} className="flex items-center gap-1 text-[12px] text-muted-foreground">
                          <RiFlaskLine className="text-xs text-teal-600 dark:text-teal-400" />{ac.cluster.name}
                        </span>
                      ))}
                      {a.isGlobal && <span className="text-[12px] text-muted-foreground">Global</span>}
                      {a.publishedAt && <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><RiTimeLine className="text-xs" />{new Date(a.publishedAt).toLocaleDateString()}</span>}
                      {a.scheduledAt && <span className="flex items-center gap-1 text-[12px] text-violet-600 dark:text-violet-400"><RiCalendarLine className="text-xs" />Scheduled: {new Date(a.scheduledAt).toLocaleString()}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(a.id)} className="flex-shrink-0 text-muted-foreground/40 hover:text-red-500 transition-colors text-base mt-0.5"><RiDeleteBinLine /></button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}